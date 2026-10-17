/**
 * Pure cart logic for project item drives. No Airtable calls, so it can be
 * tested directly. Items are stored on a Donation as readable lines:
 *   2 × Christmas Gift [recSupply123]
 */

export type CartLine = { supplyId: string; name: string; quantity: number; unitPrice: number };

export type SupplyForCart = {
  id: string;
  name: string;
  price: number;
  quantityNeeded: number;
  quantitySourcedInKind: number;
};

const LINE_RE = /^(\d+)\s*×\s*(.+?)\s*\[(rec[a-zA-Z0-9]+)\]\s*$/;

export function formatItemLines(lines: CartLine[]): string {
  return lines.map((line) => `${line.quantity} × ${line.name} [${line.supplyId}]`).join("\n");
}

/** Quantities per Supply id from a Donation's Items text. Unreadable lines are skipped. */
export function parseItemLines(text: string | null | undefined): Map<string, number> {
  const counts = new Map<string, number>();
  for (const raw of (text ?? "").split(/\r?\n/)) {
    const match = raw.trim().match(LINE_RE);
    if (!match) continue;
    const quantity = Number(match[1]);
    if (!Number.isSafeInteger(quantity) || quantity < 1) continue;
    counts.set(match[3], (counts.get(match[3]) ?? 0) + quantity);
  }
  return counts;
}

/** Items still needed after verified gifts and in-kind donations. Never below zero. */
export function remainingFor(supply: SupplyForCart, funded: number): number {
  return Math.max(0, supply.quantityNeeded - supply.quantitySourcedInKind - funded);
}

export type PricedCart =
  | { ok: true; lines: CartLine[]; total: number }
  | { ok: false; error: string };

/**
 * Check a requested cart against the project's real items and prices.
 * Prices always come from Airtable, never from the browser.
 */
export function priceCart(
  requested: Array<{ supplyId: unknown; quantity: unknown }>,
  supplies: SupplyForCart[],
  funded: Map<string, number>
): PricedCart {
  if (!Array.isArray(requested) || requested.length === 0) return { ok: false, error: "Your cart is empty." };
  if (requested.length > 50) return { ok: false, error: "Too many items in one cart." };

  const byId = new Map(supplies.map((supply) => [supply.id, supply]));
  const merged = new Map<string, number>();
  for (const item of requested) {
    const id = typeof item?.supplyId === "string" ? item.supplyId : "";
    const quantity = typeof item?.quantity === "number" ? item.quantity : NaN;
    if (!byId.has(id)) return { ok: false, error: "One of these items isn't part of this project anymore." };
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000) return { ok: false, error: "Choose a valid quantity." };
    merged.set(id, (merged.get(id) ?? 0) + quantity);
  }

  const lines: CartLine[] = [];
  for (const [id, quantity] of merged) {
    const supply = byId.get(id)!;
    if (!(supply.price > 0)) return { ok: false, error: `${supply.name} doesn't have a price yet.` };
    const left = remainingFor(supply, funded.get(id) ?? 0);
    if (quantity > left) {
      return { ok: false, error: left === 0 ? `${supply.name} is fully funded.` : `Only ${left} ${supply.name} still needed.` };
    }
    lines.push({ supplyId: id, name: supply.name, quantity, unitPrice: supply.price });
  }
  const total = Math.round(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0) * 100) / 100;
  return { ok: true, lines, total };
}
