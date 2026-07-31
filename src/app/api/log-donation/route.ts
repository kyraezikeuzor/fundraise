import { NextResponse } from "next/server";
import {
  createDonation,
  extractRecordIdFromSlug,
  getPersonById,
} from "@/lib/airtable";

type LogDonationBody = {
  slug?: unknown;
  amount?: unknown;
  total?: unknown;
  comment?: unknown;
  donorName?: unknown;
  frequency?: unknown;
  method?: unknown;
  sessionId?: unknown;
  donationObj?: unknown;
};

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

export async function POST(request: Request) {
  let body: LogDonationBody;

  try {
    body = (await request.json()) as LogDonationBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const amount = asAmount(body.amount) ?? asAmount(body.total);
  const comment = asOptionalString(body.comment);
  const donorName = asOptionalString(body.donorName);
  const frequency = asOptionalString(body.frequency);
  const paymentMethod = asOptionalString(body.method);
  const sessionId = asOptionalString(body.sessionId);

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "Missing volunteer slug" },
      { status: 400 }
    );
  }

  if (amount === null) {
    return NextResponse.json(
      { ok: false, error: "Invalid donation amount" },
      { status: 400 }
    );
  }

  // Client-side Givebutter events are spoofable. Acceptable for volunteer
  // credit attribution only — not proof of funds received.
  if (body.donationObj) {
    console.log("[log-donation] raw donationObj:", body.donationObj);
  }

  try {
    const recordId = extractRecordIdFromSlug(slug);
    const person = recordId ? await getPersonById(recordId) : null;

    const donation = await createDonation({
      personId: person?.id ?? null,
      value: amount,
      comment,
      donorName,
      frequency,
      paymentMethod,
      sessionId,
      status: person ? "Logged" : "Flagged",
      slug,
    });

    return NextResponse.json({
      ok: true,
      donationId: donation.id,
      status: person ? "Logged" : "Flagged",
      personId: person?.id ?? null,
      slug,
      amount,
    });
  } catch (error) {
    console.error("[log-donation] failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to log donation",
      },
      { status: 500 }
    );
  }
}
