"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import type { ProjectItem } from "@/lib/projects";
import { formatUsd } from "@/lib/format";
import { typography } from "@/styles/typography";

type Props = {
  projectId: string;
  projectSlug: string;
  items: ProjectItem[];
  volunteerSlug: string | null;
};

/** Pick items, see the total, then continue to Givebutter for that amount. */
export function ProjectDonate({ projectId, projectSlug, items, volunteerSlug }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const lines = useMemo(
    () => items.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => ({ item, quantity: cart[item.id] })),
    [items, cart]
  );
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

  const change = (item: ProjectItem, delta: number) =>
    setCart((current) => ({ ...current, [item.id]: Math.max(0, Math.min(item.remaining, (current[item.id] ?? 0) + delta)) }));

  async function checkout(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/projects/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          email,
          name,
          volunteer: volunteerSlug,
          items: lines.map((line) => ({ supplyId: line.item.id, quantity: line.quantity })),
        }),
      });
      const data = (await res.json()) as { orderId?: string; amount?: number; error?: string };
      if (!res.ok || !data.orderId) throw new Error(data.error || "We couldn't start your donation.");
      router.push(`/projects/${projectSlug}/checkout?order=${data.orderId}&amount=${data.amount}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      setSaving(false);
    }
  }

  if (items.length === 0) {
    return (
      <p className={`${typography.body} rounded-2xl border-2 border-border bg-background p-6 text-muted-foreground`}>
        Items for this project are coming soon.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const inCart = cart[item.id] ?? 0;
          const done = item.remaining === 0;
          return (
            <li key={item.id} className="flex flex-col rounded-2xl border-2 border-border bg-background p-4">
              <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <h3 className={`${typography.cardTitle} mt-3 text-foreground`}>{item.name}</h3>
              {item.description && <p className={`${typography.bodySmall} mt-1 text-[#4A4A4A]`}>{item.description}</p>}
              <p className="mt-2 text-lg font-semibold text-foreground">{formatUsd(item.price)}</p>
              <p className={`${typography.metadata} text-muted-foreground`}>
                {done ? "Fully funded" : `${item.remaining} of ${item.quantityNeeded} still needed`}
              </p>
              <div className="mt-auto pt-3">
                {done ? (
                  <p className={`flex h-10 items-center justify-center rounded-lg bg-muted ${typography.button} text-muted-foreground`}>Funded, thank you!</p>
                ) : inCart === 0 ? (
                  <button type="button" onClick={() => change(item, 1)} className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-lg ${typography.button} ${typography.buttonPrimary}`}>
                    <Plus className="h-4 w-4" aria-hidden />
                    Add
                  </button>
                ) : (
                  <div className="flex h-10 items-center justify-between rounded-lg border-2 border-border">
                    <button type="button" onClick={() => change(item, -1)} aria-label={`Remove one ${item.name}`} className="flex h-full w-10 items-center justify-center hover:bg-muted">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className={`${typography.label} text-foreground`} aria-live="polite">{inCart}</span>
                    <button type="button" onClick={() => change(item, 1)} disabled={inCart >= item.remaining} aria-label={`Add one ${item.name}`} className="flex h-full w-10 items-center justify-center hover:bg-muted disabled:opacity-40">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={checkout} className="rounded-2xl border-2 border-border bg-background p-5 lg:sticky lg:top-6">
        <p className={`${typography.sectionTitle} flex items-center gap-2 text-foreground`}>
          <ShoppingBag className="h-5 w-5" aria-hidden />
          Your gift
        </p>
        {lines.length === 0 ? (
          <p className={`${typography.bodySmall} mt-3 text-muted-foreground`}>Add items to see your total.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lines.map(({ item, quantity }) => (
              <li key={item.id} className={`${typography.bodySmall} flex justify-between gap-3 text-foreground`}>
                <span>{quantity} × {item.name}</span>
                <span className="font-medium">{formatUsd(item.price * quantity)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <span className={`${typography.label} text-foreground`}>Total</span>
          <span className="text-xl font-semibold text-foreground">{formatUsd(total)}</span>
        </div>
        {lines.length > 0 && (
          <>
            <label className={`${typography.label} mt-4 block text-foreground`} htmlFor="donor-name">Name (optional)</label>
            <input id="donor-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className="mt-1.5 h-11 w-full rounded-lg border-2 border-border px-3 text-sm outline-none focus-visible:border-bridge-action" />
            <label className={`${typography.label} mt-3 block text-foreground`} htmlFor="donor-email">Email</label>
            <input id="donor-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" className="mt-1.5 h-11 w-full rounded-lg border-2 border-border px-3 text-sm outline-none focus-visible:border-bridge-action" />
            <p className={`${typography.helper} mt-1.5 text-muted-foreground`}>Use the same email at checkout so we can match your gift.</p>
          </>
        )}
        <button
          type="submit"
          disabled={lines.length === 0 || saving}
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-bridge-action text-base font-semibold text-white transition-colors hover:bg-bridge-action-hover disabled:opacity-50"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {saving ? "Starting checkout…" : "Continue to donate"}
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      </form>
    </div>
  );
}
