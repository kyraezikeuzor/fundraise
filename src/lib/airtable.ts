/**
 * Airtable helpers for fundraise volunteer donation tracking.
 * Field names match the live base exactly — do not rename.
 *
 * Donations columns currently in the base:
 *   Linked Person, Value, Donation Date, Comment, Donor Name,
 *   Status, Source, Slug, Id
 *
 * Frequency / Payment Method / Session ID are written when present; if Airtable
 * rejects them as unknown fields we fall back to appending them onto Comment
 * so no Givebutter metadata is lost. Add those three columns in Airtable to
 * store them as first-class fields.
 */

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function getConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!apiKey || !baseId) {
    throw new Error(
      "Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables"
    );
  }
  return { apiKey, baseId };
}

export function escapeFormulaString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

type AirtableListResponse<TFields> = {
  records: Array<{
    id: string;
    createdTime: string;
    fields: TFields;
  }>;
  offset?: string;
};

async function listAllRecords<TFields>(
  table: string,
  options?: { filterByFormula?: string }
): Promise<Array<{ id: string; createdTime: string; fields: TFields }>> {
  const { apiKey, baseId } = getConfig();
  const records: Array<{ id: string; createdTime: string; fields: TFields }> =
    [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    if (options?.filterByFormula) {
      params.set("filterByFormula", options.filterByFormula);
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}?${params}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable ${table} list failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as AirtableListResponse<TFields>;
    for (const record of data.records ?? []) {
      records.push(record);
    }
    offset = data.offset;
  } while (offset);

  return records;
}

async function createRecord<TFields extends object>(
  table: string,
  fields: TFields,
  options?: { typecast?: boolean }
): Promise<{ id: string; createdTime: string; fields: TFields }> {
  const { apiKey, baseId } = getConfig();
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields,
      typecast: options?.typecast ?? false,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${table} create failed (${res.status}): ${body}`);
  }

  return (await res.json()) as {
    id: string;
    createdTime: string;
    fields: TFields;
  };
}

async function getRecord<TFields>(
  table: string,
  id: string
): Promise<{ id: string; createdTime: string; fields: TFields } | null> {
  // Airtable record ids are "rec" + alphanumerics. Reject junk early so a
  // bogus slug doesn't 403 the whole log-donation request.
  if (!/^rec[a-zA-Z0-9]+$/.test(id)) return null;

  const { apiKey, baseId } = getConfig();
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(table)}/${id}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    // Invalid / unknown ids sometimes return 403 instead of 404.
    if (res.status === 403) {
      console.warn(`[airtable] ${table} get ${id} → ${res.status}: ${body}`);
      return null;
    }
    throw new Error(`Airtable ${table} get failed (${res.status}): ${body}`);
  }

  return (await res.json()) as {
    id: string;
    createdTime: string;
    fields: TFields;
  };
}

/** Slugify a name segment: lowercase, non-alphanumerics → hyphens. */
export function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Volunteer fundraiser slug: {firstname}-{lastname}-{airtableRecordId}
 * e.g. kyra-ezikeuzor-recAbC123XYZ
 */
export function buildPersonSlug(
  firstName: string,
  lastName: string,
  recordId: string
): string {
  const namePart = [firstName, lastName]
    .map(slugifySegment)
    .filter(Boolean)
    .join("-");
  const id = recordId.trim();
  return namePart ? `${namePart}-${id}` : id;
}

/** Pull the trailing Airtable record id (rec…) out of a fundraiser slug. */
export function extractRecordIdFromSlug(slug: string): string | null {
  const match = slug.trim().match(/(rec[a-zA-Z0-9]+)$/i);
  return match?.[1] ?? null;
}

// ——— People ———

export interface PersonFields {
  Email?: string;
  "First Name"?: string;
  "Last Name"?: string;
  Status?: string;
}

export interface Person {
  id: string;
  createdTime: string;
  fields: PersonFields;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  slug: string;
}

export function mapPersonRecord(record: {
  id: string;
  createdTime: string;
  fields: PersonFields;
}): Person | null {
  const firstName = record.fields["First Name"]?.trim() || "";
  const lastName = record.fields["Last Name"]?.trim() || "";
  const email = record.fields.Email?.trim() || null;
  if (!firstName && !lastName && !email) return null;

  const displayName =
    [firstName, lastName].filter(Boolean).join(" ") || email || "Volunteer";
  const slug = buildPersonSlug(firstName, lastName, record.id);

  return {
    id: record.id,
    createdTime: record.createdTime,
    fields: record.fields,
    firstName,
    lastName,
    displayName,
    email,
    slug,
  };
}

export async function fetchAllPeople(): Promise<Person[]> {
  const records = await listAllRecords<PersonFields>("People");
  return records
    .map(mapPersonRecord)
    .filter((person): person is Person => person !== null);
}

export async function getPersonById(id: string): Promise<Person | null> {
  const record = await getRecord<PersonFields>("People", id);
  if (!record) return null;
  return mapPersonRecord(record);
}

export async function getPersonBySlug(slug: string): Promise<Person | null> {
  const recordId = extractRecordIdFromSlug(slug);
  if (!recordId) return null;
  return getPersonById(recordId);
}

// ——— Donations ———

export type DonationStatus = "Logged" | "Flagged";

export interface DonationFields {
  "Linked Person"?: string[];
  Value?: number;
  "Donation Date"?: string;
  Comment?: string;
  "Donor Name"?: string;
  Frequency?: string;
  "Payment Method"?: string;
  "Session ID"?: string;
  Status?: DonationStatus;
  Source?: string;
  Slug?: string;
}

const OPTIONAL_DONATION_FIELDS = [
  "Frequency",
  "Payment Method",
  "Session ID",
] as const;

function appendGivebutterMeta(
  comment: string | undefined,
  meta: {
    frequency?: string;
    paymentMethod?: string;
    sessionId?: string;
  }
): string | undefined {
  const lines = [
    meta.frequency ? `Frequency: ${meta.frequency}` : null,
    meta.paymentMethod ? `Payment Method: ${meta.paymentMethod}` : null,
    meta.sessionId ? `Session ID: ${meta.sessionId}` : null,
  ].filter(Boolean);

  if (lines.length === 0) return comment;

  const block = `[Givebutter meta]\n${lines.join("\n")}`;
  return comment?.trim() ? `${comment.trim()}\n\n${block}` : block;
}

export interface Donation {
  id: string;
  createdTime: string;
  value: number;
  donorName: string;
  donationDate: string;
  comment: string | null;
  status: string | null;
  slug: string | null;
}

function mapDonationRecord(record: {
  id: string;
  createdTime: string;
  fields: DonationFields;
}): Donation {
  const value =
    typeof record.fields.Value === "number" && Number.isFinite(record.fields.Value)
      ? record.fields.Value
      : 0;
  const donorName = record.fields["Donor Name"]?.trim() || "Anonymous";
  const donationDate =
    record.fields["Donation Date"]?.trim() || record.createdTime;

  return {
    id: record.id,
    createdTime: record.createdTime,
    value,
    donorName,
    donationDate,
    comment: record.fields.Comment?.trim() || null,
    status: record.fields.Status ?? null,
    slug: record.fields.Slug?.trim() || null,
  };
}

/**
 * Donations credited to a Person. Linked-record ID filters are unreliable in
 * Airtable formulas, so we pull Donations and match Linked Person in memory.
 */
export async function getDonationsForPerson(
  personId: string,
  options?: { limit?: number }
): Promise<Donation[]> {
  const limit = options?.limit ?? 5;
  const records = await listAllRecords<DonationFields>("Donations");

  const matched = records
    .filter((record) =>
      (record.fields["Linked Person"] ?? []).includes(personId)
    )
    .map(mapDonationRecord)
    .sort(
      (a, b) =>
        new Date(b.donationDate).getTime() - new Date(a.donationDate).getTime()
    );

  return matched.slice(0, limit);
}

/** Sum of Value for all donations linked to this Person. */
export async function getAmountRaisedForPerson(
  personId: string
): Promise<number> {
  const donations = await getDonationsForPerson(personId, { limit: 10_000 });
  return donations.reduce((sum, donation) => sum + donation.value, 0);
}

export async function getPersonFundraisingStats(personId: string): Promise<{
  amountRaised: number;
  recentDonations: Donation[];
}> {
  const donations = await getDonationsForPerson(personId, { limit: 10_000 });
  return {
    amountRaised: donations.reduce((sum, donation) => sum + donation.value, 0),
    recentDonations: donations.slice(0, 5),
  };
}

export async function createDonation(options: {
  personId?: string | null;
  value: number;
  comment?: string;
  donorName?: string;
  frequency?: string;
  paymentMethod?: string;
  sessionId?: string;
  status: DonationStatus;
  slug: string;
  donationDate?: string;
}): Promise<{ id: string; fields: DonationFields }> {
  const fields: DonationFields = {
    Value: options.value,
    "Donation Date": options.donationDate ?? new Date().toISOString(),
    Status: options.status,
    Source: "Fundraise Page",
    Slug: options.slug,
  };

  if (options.personId) {
    fields["Linked Person"] = [options.personId];
  }
  if (options.comment?.trim()) {
    fields.Comment = options.comment.trim();
  }
  if (options.donorName?.trim()) {
    fields["Donor Name"] = options.donorName.trim();
  }
  if (options.frequency?.trim()) {
    fields.Frequency = options.frequency.trim();
  }
  if (options.paymentMethod?.trim()) {
    fields["Payment Method"] = options.paymentMethod.trim();
  }
  if (options.sessionId?.trim()) {
    fields["Session ID"] = options.sessionId.trim();
  }

  try {
    // typecast: allow Status "Logged" / Source "Fundraise Page" select values
    const created = await createRecord("Donations", fields, { typecast: true });
    return { id: created.id, fields: created.fields };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!/Unknown field name/i.test(message)) throw error;

    // Base is missing Frequency / Payment Method / Session ID — fold into Comment.
    console.warn(
      "[airtable] Donations missing optional Givebutter fields; storing in Comment:",
      message
    );

    const fallback: DonationFields = { ...fields };
    for (const key of OPTIONAL_DONATION_FIELDS) {
      delete fallback[key];
    }
    fallback.Comment = appendGivebutterMeta(fields.Comment, {
      frequency: options.frequency,
      paymentMethod: options.paymentMethod,
      sessionId: options.sessionId,
    });

    const created = await createRecord("Donations", fallback, {
      typecast: true,
    });
    return { id: created.id, fields: created.fields };
  }
}
