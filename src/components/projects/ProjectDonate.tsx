"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Minus, Plus, Share2 } from "lucide-react";
import type { ProjectItem, Supporter } from "@/lib/projects";
import { avatarColor } from "@/lib/avatar";
import { donorInitials, formatRelativeTime, formatUsd } from "@/lib/format";
import { typography } from "@/styles/typography";

type Props = {
  projectId: string;
  projectSlug: string;
  items: ProjectItem[];
  volunteerSlug: string | null;
  itemsFunded: number;
  itemsNeeded: number;
  amountRaised: number;
  supporterCount: number;
  supporters: Supporter[];
  /** Server-rendered story (title, photo, description) above the items. */
  intro: ReactNode;
  /** Server-rendered sections below the items. */
  outro: ReactNode;
};

function ProgressRing({ percent }: { percent: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px] shrink-0" role="img" aria-label={`${percent}% of items funded`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="#EEF0F2" strokeWidth="7" />
      <circle cx="36" cy="36" r={r} fill="none" stroke="#1aa1ff" strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} transform="rotate(-90 36 36)" />
      <text x="36" y="40" textAnchor="middle" className="fill-foreground text-[13px] font-semibold">{percent}%</text>
    </svg>
  );
}

function ItemCard({ item, inCart, onChange }: { item: ProjectItem; inCart: number; onChange: (delta: number) => void }) {
  const done = item.remaining === 0;
  const fundedPct = item.quantityNeeded > 0 ? Math.min(100, (item.funded / item.quantityNeeded) * 100) : 0;
  return (
    <li className="flex gap-4 rounded-2xl border-2 border-border bg-background p-3.5">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
        {item.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className={`${typography.cardTitle} text-foreground`}>{item.name}</h3>
        <p className={`${typography.metadata} text-muted-foreground`}>{formatUsd(item.price)} each</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-bridge-action" style={{ width: `${fundedPct}%` }} />
        </div>
        <p className={`${typography.helper} mt-1 text-muted-foreground`}>{item.funded} of {item.quantityNeeded} funded</p>
        <div className="mt-auto flex justify-end pt-2">
          {done ? (
            <span className={`inline-flex h-9 items-center gap-1 ${typography.button} text-emerald-700`}>
              <Check className="h-4 w-4" aria-hidden /> Funded
            </span>
          ) : inCart === 0 ? (
            <button type="button" onClick={() => onChange(1)} className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 ${typography.button} ${typography.buttonActionQuiet}`}>
              <Plus className="h-4 w-4" aria-hidden /> Add
            </button>
          ) : (
            <div className="inline-flex h-9 items-center rounded-lg border-2 border-border">
              <button type="button" onClick={() => onChange(-1)} aria-label={`Remove one ${item.name}`} className="flex h-full w-9 items-center justify-center hover:bg-muted">
                <Minus className="h-4 w-4" />
              </button>
              <span className={`${typography.label} w-8 text-center text-foreground`} aria-live="polite">{inCart}</span>
              <button type="button" onClick={() => onChange(1)} disabled={inCart >= item.remaining} aria-label={`Add one ${item.name}`} className="flex h-full w-9 items-center justify-center hover:bg-muted disabled:opacity-40">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * GoFundMe-style layout: story and items on the left, a sticky gift card on
 * the right with progress, the cart, Donate and Share, and recent supporters.
 */
export function ProjectDonate(props: Props) {
  const { projectId, projectSlug, items, volunteerSlug } = props;
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const lines = useMemo(
    () => items.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => ({ item, quantity: cart[item.id] })),
    [items, cart]
  );
  const total = lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const percent = props.itemsNeeded > 0 ? Math.min(100, Math.round((props.itemsFunded / props.itemsNeeded) * 100)) : 0;

  const change = (item: ProjectItem, delta: number) =>
    setCart((current) => ({ ...current, [item.id]: Math.max(0, Math.min(item.remaining, (current[item.id] ?? 0) + delta)) }));

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

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

  return (
    <div className="grid grid-cols-1 items-start gap-8 pb-24 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:pb-0">
      <div className="min-w-0 space-y-10">
        {props.intro}

        <section aria-labelledby="donate-items">
          <h2 id="donate-items" className={`${typography.sectionTitle} text-foreground`}>Donate items</h2>
          <p className={`${typography.bodySmall} mt-1 text-muted-foreground`}>Choose what to give. Omelora buys each item and delivers it.</p>
          {items.length === 0 ? (
            <p className={`${typography.body} mt-4 rounded-2xl border-2 border-border p-6 text-muted-foreground`}>Items for this project are coming soon.</p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} inCart={cart[item.id] ?? 0} onChange={(d) => change(item, d)} />
              ))}
            </ul>
          )}
        </section>

        {props.outro}
      </div>

      <aside id="gift-card" className="scroll-mt-6 rounded-2xl border-2 border-border bg-background p-5 lg:sticky lg:top-6">
        <div className="flex items-center gap-4">
          <ProgressRing percent={percent} />
          <div className="min-w-0">
            <p className="text-2xl font-semibold leading-tight text-foreground">{formatUsd(props.amountRaised)} raised</p>
            <p className={`${typography.bodySmall} text-muted-foreground`}>
              {props.itemsFunded} of {props.itemsNeeded} items funded · {props.supporterCount} {props.supporterCount === 1 ? "supporter" : "supporters"}
            </p>
          </div>
        </div>

        <form onSubmit={checkout} className="mt-5 border-t border-border pt-4">
          {lines.length === 0 ? (
            <p className={`${typography.bodySmall} text-muted-foreground`}>Add items to start your gift.</p>
          ) : (
            <ul className="space-y-1.5">
              {lines.map(({ item, quantity }) => (
                <li key={item.id} className={`${typography.bodySmall} flex justify-between gap-3 text-foreground`}>
                  <span>{quantity} × {item.name}</span>
                  <span className="font-medium">{formatUsd(item.price * quantity)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-3 pt-1.5">
                <span className={`${typography.label} text-foreground`}>Total</span>
                <span className="text-lg font-semibold text-foreground">{formatUsd(total)}</span>
              </li>
            </ul>
          )}
          {lines.length > 0 && (
            <div className="mt-3 space-y-2">
              <input aria-label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Name (optional)" className="h-11 w-full rounded-lg border-2 border-border px-3 text-sm outline-none focus-visible:border-bridge-action" />
              <input aria-label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="Email for your receipt" className="h-11 w-full rounded-lg border-2 border-border px-3 text-sm outline-none focus-visible:border-bridge-action" />
            </div>
          )}
          <button
            type={lines.length ? "submit" : "button"}
            onClick={lines.length ? undefined : () => document.getElementById("donate-items")?.scrollIntoView({ behavior: "smooth" })}
            disabled={saving}
            className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-bridge-action text-base font-semibold text-white transition-colors hover:bg-bridge-action-hover disabled:opacity-60"
          >
            {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {saving ? "Starting checkout…" : lines.length ? `Donate ${formatUsd(total)}` : "Donate items"}
          </button>
          <button type="button" onClick={share} className={`mt-2.5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full border-2 border-border ${typography.button} text-base text-foreground hover:bg-muted`}>
            <Share2 className="h-4 w-4" aria-hidden />
            {copied ? "Link copied" : "Share"}
          </button>
          {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        </form>

        <div className="mt-5 border-t border-border pt-4">
          <p className={`${typography.label} text-foreground`}>Recent supporters</p>
          {props.supporters.length === 0 ? (
            <p className={`${typography.bodySmall} mt-2 text-muted-foreground`}>Be the first to give.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {props.supporters.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${avatarColor(s.id)}`} aria-hidden>
                    {donorInitials(s.name)}
                  </span>
                  <div className="min-w-0">
                    <p className={`${typography.bodySmall} truncate font-medium text-foreground`}>{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatUsd(s.amount)} · {s.summary} · {formatRelativeTime(s.date)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Phones: keep the total and Donate in reach once items are picked. */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background px-4 py-3 lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <button type="button" onClick={() => document.getElementById("gift-card")?.scrollIntoView({ behavior: "smooth" })} className="flex h-12 w-full items-center justify-center rounded-full bg-bridge-action text-base font-semibold text-white">
            Donate {formatUsd(total)} · {count} {count === 1 ? "item" : "items"}
          </button>
        </div>
      )}
    </div>
  );
}
