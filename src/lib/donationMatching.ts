import type { Donation } from "@/lib/airtable";

/** A confirmed payment from Givebutter's webhook, reduced to what matching needs. */
export type ConfirmedTransaction = {
  id: string;
  amount: number; // dollars
  grossAmount: number | null; // dollars, includes covered fees
  donorEmail: string | null;
  createdAt: string;
};

const WINDOW_MS = 6 * 60 * 60 * 1000;

function sameMoney(a: number, b: number | null) {
  return b !== null && Math.abs(a - b) < 0.01;
}

/**
 * Pair a confirmed payment with the Pending record the volunteer page wrote.
 * The browser knows which volunteer link was used; Givebutter knows the
 * money is real. A match needs the same amount (with or without covered
 * fees) within six hours, and the same donor email when both sides have it.
 * Returns null when there is no match or more than one equally good match,
 * so a gift is never credited to the wrong volunteer.
 */
export function pickPendingMatch(pending: Donation[], txn: ConfirmedTransaction): Donation | null {
  const paidAt = new Date(txn.createdAt).getTime();
  const candidates = pending.filter((donation) => {
    if (donation.status !== "Pending" || donation.transactionId) return false;
    if (!sameMoney(donation.value, txn.amount) && !sameMoney(donation.value, txn.grossAmount)) return false;
    if (Math.abs(new Date(donation.donationDate).getTime() - paidAt) > WINDOW_MS) return false;
    if (donation.donorEmail && txn.donorEmail && donation.donorEmail !== txn.donorEmail) return false;
    return true;
  });
  if (candidates.length === 0) return null;

  // Prefer an email match, then the closest time. Refuse to guess between ties.
  const score = (d: Donation) => [
    d.donorEmail && d.donorEmail === txn.donorEmail ? 0 : 1,
    Math.abs(new Date(d.donationDate).getTime() - paidAt),
  ] as const;
  const sorted = [...candidates].sort((a, b) => score(a)[0] - score(b)[0] || score(a)[1] - score(b)[1]);
  const [best, next] = sorted;
  // Two candidates and no email to tell them apart: don't guess.
  if (next && score(best)[0] === 1 && score(next)[0] === 1) return null;
  return best;
}
