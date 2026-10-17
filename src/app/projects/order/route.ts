import { NextResponse } from "next/server";
import { createDonation, extractRecordIdFromSlug, getPersonById, getRecord } from "@/lib/airtable";
import { formatItemLines, priceCart } from "@/lib/projectCart";
import { getProjectSupplies } from "@/lib/projects";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /projects/order  { projectId, items: [{ supplyId, quantity }], email, name?, volunteer? }
 * Saves a Pending Donation with the cart. It counts only after Givebutter's
 * webhook confirms a payment for the same amount and email.
 * Lives under /projects so omelora.org can forward it with the pages.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const projectId = typeof body.projectId === "string" ? body.projectId : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
  const volunteerSlug = typeof body.volunteer === "string" ? body.volunteer.trim().slice(0, 200) : "";

  if (!/^rec[a-zA-Z0-9]+$/.test(projectId)) return NextResponse.json({ error: "Unknown project" }, { status: 400 });
  if (!EMAIL_RE.test(email) || email.length > 200) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });

  try {
    const project = await getRecord<{ Status?: string }>("Projects", projectId);
    if (!project) return NextResponse.json({ error: "Unknown project" }, { status: 404 });

    const { items } = await getProjectSupplies(projectId);
    const funded = new Map(items.map((item) => [item.id, item.funded]));
    const cart = priceCart(Array.isArray(body.items) ? body.items : [], items, funded);
    if (!cart.ok) return NextResponse.json({ error: cart.error }, { status: 409 });

    const volunteerId = volunteerSlug ? extractRecordIdFromSlug(volunteerSlug) : null;
    const volunteer = volunteerId ? await getPersonById(volunteerId) : null;

    const order = await createDonation({
      personId: volunteer?.id ?? null,
      value: cart.total,
      donorName: name || undefined,
      donorEmail: email,
      status: "Pending",
      slug: volunteer ? volunteerSlug : "",
      source: "Project Page",
      items: formatItemLines(cart.lines),
      projectId,
    });
    return NextResponse.json({ orderId: order.id, amount: cart.total, lines: cart.lines }, { status: 201 });
  } catch (error) {
    console.error("[projects/order]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "We couldn't start your donation. Please try again." }, { status: 500 });
  }
}
