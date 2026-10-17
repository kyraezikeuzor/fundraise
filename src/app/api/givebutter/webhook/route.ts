import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createDonation, fetchAllDonations, updateDonation } from "@/lib/airtable";
import { pickPendingMatch, type ConfirmedTransaction } from "@/lib/donationMatching";

export const dynamic = "force-dynamic";

/** Givebutter sends the webhook's signing secret in the "Signature" header. */
function signatureIsValid(header: string | null): boolean {
  const secret = process.env.GIVEBUTTER_WEBHOOK_SECRET;
  if (!secret || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Ask Givebutter's API whether this transaction really exists, so a test
 * event ("sample_tid") or a forged request can never mark a gift Verified.
 * Returns false when the API key is missing, so nothing is trusted unchecked.
 */
async function transactionExists(id: string): Promise<boolean> {
  const apiKey = process.env.GIVEBUTTER_API_KEY;
  if (!apiKey) {
    console.warn("[givebutter webhook] GIVEBUTTER_API_KEY is not set; ignoring the event");
    return false;
  }
  const res = await fetch(`https://api.givebutter.com/v1/transactions/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
  });
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Givebutter transaction lookup failed (${res.status})`);
  const body = (await res.json()) as { data?: { status?: string }; status?: string };
  const status = (body.data?.status ?? body.status ?? "").toLowerCase();
  return !["failed", "cancelled", "canceled", "voided"].includes(status);
}

type Payload = { event?: string; type?: string; data?: Record<string, unknown> };

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

/**
 * POST /api/givebutter/webhook
 * transaction.succeeded: confirm the matching Pending donation, or record an
 *   unattributed one so no real gift is lost.
 * refund.created: mark the donation Refunded so it stops counting.
 */
export async function POST(request: Request) {
  if (!signatureIsValid(request.headers.get("signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const event = payload.event ?? payload.type ?? "";
  const data = payload.data ?? {};

  try {
    const donations = await fetchAllDonations();

    if (event === "transaction.succeeded") {
      const id = str(data.id);
      // Live webhooks send dollars (a $1 gift arrives as 1), though the docs say cents.
      const amount = num(data.amount);
      if (!id || amount === null) return NextResponse.json({ error: "Missing transaction id or amount" }, { status: 400 });

      // Givebutter retries deliveries; a transaction is recorded once.
      if (donations.some((d) => d.transactionId === id)) return NextResponse.json({ ok: true, duplicate: true });

      if (!(await transactionExists(id))) {
        return NextResponse.json({ ok: true, ignored: "not a real Givebutter transaction" });
      }

      const campaignFilter = process.env.GIVEBUTTER_CAMPAIGN_ID;
      const campaign = (data.campaign ?? {}) as Record<string, unknown>;
      if (campaignFilter && String(campaign.id ?? data.campaign_id ?? "") !== campaignFilter) {
        return NextResponse.json({ ok: true, ignored: "other campaign" });
      }

      const donor = (data.donor ?? {}) as Record<string, unknown>;
      const anonymous = data.anonymous === true;
      const donorName = anonymous ? "Anonymous" : [str(donor.first_name), str(donor.last_name)].filter(Boolean).join(" ") || undefined;
      const txn: ConfirmedTransaction = {
        id,
        // Gross includes fees the donor chose to cover. Never also read the amount as
        // cents: a $100 gift would then look like $1 and could match the wrong gift.
        amounts: [amount, num(data.gross_amount)].filter((v): v is number => v !== null && v > 0),
        donorEmail: str(donor.email)?.toLowerCase() ?? null,
        createdAt: str(data.created_at) ?? new Date().toISOString(),
      };

      const match = pickPendingMatch(donations, txn);
      if (match) {
        await updateDonation(match.id, {
          Status: "Verified",
          "Givebutter Transaction ID": id,
          ...(donorName ? { "Donor Name": donorName } : {}),
          ...(txn.donorEmail ? { "Donor Email": txn.donorEmail } : {}),
        });
        return NextResponse.json({ ok: true, matched: match.id });
      }

      // A real gift we couldn't pair with a volunteer link: keep it, uncredited.
      const created = await createDonation({
        value: amount,
        donorName,
        comment: str(data.note) ?? undefined,
        status: "Verified",
        slug: "",
        donationDate: txn.createdAt,
        donorEmail: txn.donorEmail ?? undefined,
        transactionId: id,
        source: "Givebutter",
      });
      return NextResponse.json({ ok: true, unattributed: created.id });
    }

    if (event === "refund.created") {
      const transaction = (data.transaction ?? {}) as Record<string, unknown>;
      const id = str(data.transaction_id) ?? str(transaction.id);
      const donation = id ? donations.find((d) => d.transactionId === id) : null;
      if (donation) await updateDonation(donation.id, { Status: "Refunded" });
      return NextResponse.json({ ok: true, refunded: donation?.id ?? null });
    }

    return NextResponse.json({ ok: true, ignored: event || "unknown event" });
  } catch (error) {
    console.error("[givebutter webhook]", error instanceof Error ? error.message : error);
    // A 500 makes Givebutter retry later, which is what we want for Airtable outages.
    return NextResponse.json({ error: "Failed to record the transaction" }, { status: 500 });
  }
}
