import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRecord } from "@/lib/airtable";
import { parseItemLines } from "@/lib/projectCart";
import { getProjectBySlug } from "@/lib/projects";
import { formatUsd } from "@/lib/format";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectCheckout } from "@/components/projects/ProjectCheckout";
import { typography } from "@/styles/typography";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ order?: string }> };

/**
 * Givebutter fills its amount from this page's ?amount= setting, so the
 * project page sends donors here with ?order=<id>&amount=<total>.
 */
export default async function CheckoutPage({ params, searchParams }: Props) {
  const [{ slug }, { order }] = await Promise.all([params, searchParams]);
  const project = await getProjectBySlug(slug);
  if (!project || !order || !/^rec[a-zA-Z0-9]+$/.test(order)) notFound();

  const donation = await getRecord<{ Items?: string; Value?: number; Status?: string; "Linked Project"?: string[] }>("Donations", order);
  if (!donation || !(donation.fields["Linked Project"] ?? []).includes(project.id)) notFound();

  const names = new Map(project.items.map((item) => [item.id, item]));
  const lines = [...parseItemLines(donation.fields.Items)].map(([id, quantity]) => ({ id, quantity, item: names.get(id) }));
  const total = donation.fields.Value ?? 0;
  const done = donation.fields.Status === "Verified";

  return (
    <div className="flex min-h-screen flex-col bg-sunrise-50">
      <ProjectHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <Link href={`/projects/${project.slug}`} className={`inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-border bg-background px-3.5 ${typography.button}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to the project
        </Link>
        <section className="mt-4 rounded-2xl border-2 border-border bg-background p-5 sm:p-7">
          <p className={`${typography.label} text-muted-foreground`}>Your gift to</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-foreground">{project.name}</h1>
          <ul className="mt-5 divide-y divide-border rounded-xl border-2 border-border">
            {lines.map(({ id, quantity, item }) => (
              <li key={id} className="flex items-center justify-between gap-3 p-3">
                <span className={`${typography.bodySmall} text-foreground`}>{quantity} × {item?.name ?? "Item"}</span>
                <span className={`${typography.bodySmall} font-medium text-foreground`}>{item ? formatUsd(item.price * quantity) : ""}</span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 p-3">
              <span className={`${typography.label} text-foreground`}>Total</span>
              <span className="text-base font-semibold text-foreground">{formatUsd(total)}</span>
            </li>
          </ul>
          {done ? (
            <p className={`${typography.body} mt-5 text-foreground`}>This gift is already confirmed. Thank you!</p>
          ) : (
            <ProjectCheckout total={total} projectSlug={project.slug} />
          )}
        </section>
      </main>
    </div>
  );
}
