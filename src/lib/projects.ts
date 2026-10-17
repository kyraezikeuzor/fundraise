import {
  countsTowardTotals,
  extractRecordIdFromSlug,
  fetchAllDonations,
  getRecord,
  listAllRecords,
  slugifySegment,
  type Donation,
} from "@/lib/airtable";
import { parseItemLines, remainingFor, type SupplyForCart } from "@/lib/projectCart";

type Attachment = { url: string; thumbnails?: { large?: { url: string } } };

type ProjectFields = {
  "Project Name"?: string;
  Status?: string;
  "Linked Center"?: string[];
  Thumbnail?: Attachment[];
  "Project Description"?: string;
  "Project Summary"?: string;
};

type SupplyFields = {
  "Supply Name"?: string;
  Project?: string[];
  Image?: Attachment[];
  Description?: string;
  "Quantity Needed"?: number;
  "Unit Cost"?: number;
  "Delivery Cost"?: number;
  "Sponsorship Price"?: number;
  "Quantity Sourced In-Kind"?: number;
  Status?: string;
};

export type ProjectItem = SupplyForCart & {
  description: string | null;
  imageUrl: string | null;
  funded: number;
  remaining: number;
};

export type Supporter = { id: string; name: string; summary: string; date: string };

export type ProjectPage = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  description: string | null;
  imageUrl: string | null;
  centerName: string | null;
  centerLocation: string | null;
  items: ProjectItem[];
  itemsNeeded: number;
  itemsFunded: number;
  amountRaised: number;
  supporters: Supporter[];
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const image = (a?: Attachment[]) => a?.[0]?.thumbnails?.large?.url || a?.[0]?.url || null;

export function buildProjectSlug(name: string, id: string): string {
  const part = slugifySegment(name);
  return part ? `${part}-${id}` : id;
}

/** Price a donor pays per item: Sponsorship Price, else unit plus delivery cost. */
function itemPrice(fields: SupplyFields): number {
  const sponsorship = num(fields["Sponsorship Price"]);
  return sponsorship > 0 ? sponsorship : num(fields["Unit Cost"]) + num(fields["Delivery Cost"]);
}

function firstName(name: string) {
  return name === "Anonymous" ? "Anonymous" : name.split(/\s+/)[0] || "Someone";
}

/** Only Verified gifts count. Pending orders do not reserve items. */
function verifiedForProject(donations: Donation[], projectId: string) {
  return donations.filter((d) => d.projectId === projectId && countsTowardTotals(d.status));
}

export async function getProjectSupplies(projectId: string): Promise<{ items: ProjectItem[]; donations: Donation[] }> {
  const [records, donations] = await Promise.all([listAllRecords<SupplyFields>("Supplies"), fetchAllDonations()]);
  const verified = verifiedForProject(donations, projectId);
  const funded = new Map<string, number>();
  for (const donation of verified) {
    for (const [id, quantity] of parseItemLines(donation.items)) funded.set(id, (funded.get(id) ?? 0) + quantity);
  }
  const items = records
    .filter((record) => (record.fields.Project ?? []).includes(projectId) && record.fields.Status?.toLowerCase() !== "hidden")
    .map((record) => {
      const f = record.fields;
      const supply: SupplyForCart = {
        id: record.id,
        name: f["Supply Name"]?.trim() || "Item",
        price: itemPrice(f),
        quantityNeeded: num(f["Quantity Needed"]),
        quantitySourcedInKind: num(f["Quantity Sourced In-Kind"]),
      };
      const fundedCount = funded.get(record.id) ?? 0;
      return {
        ...supply,
        description: f.Description?.trim() || null,
        imageUrl: image(f.Image),
        funded: fundedCount,
        remaining: remainingFor(supply, fundedCount),
      };
    });
  return { items, donations: verified };
}

export async function getProjectBySlug(slug: string): Promise<ProjectPage | null> {
  const id = extractRecordIdFromSlug(slug);
  if (!id) return null;
  const record = await getRecord<ProjectFields>("Projects", id);
  if (!record) return null;
  const f = record.fields;
  const centerId = f["Linked Center"]?.[0];
  const [center, { items, donations }] = await Promise.all([
    centerId ? getRecord<{ Name?: string; Location?: string }>("Partners", centerId) : Promise.resolve(null),
    getProjectSupplies(id),
  ]);
  const name = f["Project Name"]?.trim() || "Project";
  const nameById = new Map(items.map((item) => [item.id, item.name]));

  return {
    id,
    slug: buildProjectSlug(name, id),
    name,
    summary: f["Project Summary"]?.trim() || null,
    description: f["Project Description"]?.trim() || null,
    imageUrl: image(f.Thumbnail),
    centerName: center?.fields.Name?.trim() || null,
    centerLocation: center?.fields.Location?.trim() || null,
    items,
    itemsNeeded: items.reduce((sum, item) => sum + Math.max(0, item.quantityNeeded - item.quantitySourcedInKind), 0),
    itemsFunded: items.reduce((sum, item) => sum + Math.min(item.funded, item.quantityNeeded), 0),
    amountRaised: donations.reduce((sum, d) => sum + d.value, 0),
    supporters: donations.slice(0, 6).map((d) => ({
      id: d.id,
      name: firstName(d.donorName),
      summary: [...parseItemLines(d.items)].map(([sid, q]) => `${q} × ${nameById.get(sid) ?? "item"}`).join(", ") || "a gift",
      date: d.donationDate,
    })),
  };
}
