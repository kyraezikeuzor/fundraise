import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { MapPin } from "lucide-react";
import { getPersonBySlug } from "@/lib/airtable";
import { getProjectBySlug } from "@/lib/projects";
import { formatRelativeTime, formatUsd } from "@/lib/format";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectDonate } from "@/components/projects/ProjectDonate";
import { typography } from "@/styles/typography";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);
  return project
    ? { title: `${project.name} | Omelora`, description: project.summary ?? undefined }
    : { title: "Project not found | Omelora" };
}

export default async function ProjectPage({ params, searchParams }: Props) {
  const [{ slug }, { v }] = await Promise.all([params, searchParams]);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  if (project.slug !== slug) permanentRedirect(`/projects/${project.slug}${v ? `?v=${encodeURIComponent(v)}` : ""}`);

  // ?v=<volunteer fundraiser slug> credits that volunteer, like fundraise links.
  const volunteer = v ? await getPersonBySlug(v).catch(() => null) : null;
  const percent = project.itemsNeeded > 0 ? Math.min(100, Math.round((project.itemsFunded / project.itemsNeeded) * 100)) : 0;

  return (
    <div className="flex min-h-screen flex-col bg-sunrise-50">
      <ProjectHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid grid-cols-1 gap-6 rounded-2xl border-2 border-border bg-background p-5 sm:p-7 md:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {project.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.imageUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="flex flex-col">
            {volunteer && (
              <p className={`${typography.bodySmall} mb-3 w-fit rounded-lg ${typography.buttonActionQuiet} px-3 py-1.5`}>
                Supporting {volunteer.firstName || volunteer.displayName}&apos;s drive
              </p>
            )}
            <h1 className={`${typography.pageTitle} text-foreground`}>{project.name}</h1>
            {(project.centerName || project.centerLocation) && (
              <p className={`${typography.metadata} mt-2 flex items-center gap-1.5 text-muted-foreground`}>
                <MapPin className="h-4 w-4" aria-hidden />
                {[project.centerName, project.centerLocation].filter(Boolean).join(" · ")}
              </p>
            )}
            {project.summary && <p className={`${typography.body} mt-4 text-foreground`}>{project.summary}</p>}
            <div className="mt-auto pt-6">
              <div className="h-3 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-bridge-action" style={{ width: `${percent}%` }} />
              </div>
              <p className={`${typography.bodySmall} mt-2 text-foreground`}>
                <span className="font-semibold">{project.itemsFunded} of {project.itemsNeeded}</span> items funded · {formatUsd(project.amountRaised)} raised
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="items-heading">
          <h2 id="items-heading" className={`${typography.sectionTitle} mb-3 text-foreground`}>Items still needed</h2>
          <ProjectDonate projectId={project.id} projectSlug={project.slug} items={project.items} volunteerSlug={volunteer ? v ?? null : null} />
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          {project.description && (
            <section className="rounded-2xl border-2 border-border bg-background p-5 sm:p-7">
              <h2 className={`${typography.sectionTitle} mb-3 text-foreground`}>About this project</h2>
              <p className={`${typography.body} whitespace-pre-line text-foreground`}>{project.description}</p>
            </section>
          )}
          <section className="rounded-2xl border-2 border-border bg-background p-5 sm:p-7">
            <h2 className={`${typography.sectionTitle} mb-3 text-foreground`}>Recent supporters</h2>
            {project.supporters.length === 0 ? (
              <p className={`${typography.bodySmall} text-muted-foreground`}>Be the first to give.</p>
            ) : (
              <ul className="space-y-3">
                {project.supporters.map((s) => (
                  <li key={s.id} className={`${typography.bodySmall} text-foreground`}>
                    <span className="font-medium">{s.name}</span> gave {s.summary}
                    <span className="block text-xs text-muted-foreground">{formatRelativeTime(s.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
