import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowRight, MapPin } from "lucide-react";
import { getPersonBySlug } from "@/lib/airtable";
import { getProjectBySlug } from "@/lib/projects";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectDonate } from "@/components/projects/ProjectDonate";
import { ReadMore } from "@/components/projects/ReadMore";
import { typography } from "@/styles/typography";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ v?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);
  return project
    ? { title: `${project.name} | Omelora`, description: project.summary ?? undefined, openGraph: project.imageUrl ? { images: [project.imageUrl] } : undefined }
    : { title: "Project not found | Omelora" };
}

const STEPS = [
  { title: "Choose items", body: "Pick the items you want to give. Each one goes to the children this project serves." },
  { title: "Omelora buys and delivers", body: "We purchase every item and work with the center to get it into the children's hands." },
  { title: "See the impact", body: "We share photos and updates with supporters once the items arrive." },
];

export default async function ProjectPage({ params, searchParams }: Props) {
  const [{ slug }, { v }] = await Promise.all([params, searchParams]);
  const project = await getProjectBySlug(slug);
  if (!project) notFound();
  if (project.slug !== slug) permanentRedirect(`/projects/${project.slug}${v ? `?v=${encodeURIComponent(v)}` : ""}`);

  // ?v=<volunteer fundraiser slug> credits that volunteer, like fundraise links.
  const volunteer = v ? await getPersonBySlug(v).catch(() => null) : null;
  const place = [project.centerName, project.centerLocation].filter(Boolean).join(" · ");

  const intro = (
    <div>
      {volunteer && (
        <p className={`${typography.bodySmall} mb-3 w-fit rounded-lg px-3 py-1.5 ${typography.buttonActionQuiet}`}>
          Supporting {volunteer.firstName || volunteer.displayName}&apos;s drive
        </p>
      )}
      <h1 className={`${typography.pageTitle} text-foreground`}>{project.name}</h1>
      {place && (
        <p className={`${typography.metadata} mt-2 flex items-center gap-1.5 text-muted-foreground`}>
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {place}
        </p>
      )}
      <div className="mt-5 aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        {project.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={project.imageUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      {(project.summary || project.description) && (
        <div className="mt-6 space-y-3">
          {project.summary && <p className="text-lg leading-relaxed text-foreground">{project.summary}</p>}
          {project.description && <ReadMore text={project.description} />}
        </div>
      )}
    </div>
  );

  const outro = (
    <>
      <section aria-labelledby="how-heading">
        <h2 id="how-heading" className={`${typography.sectionTitle} text-foreground`}>How your gift works</h2>
        <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-2xl border-2 border-border p-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bridge-action text-sm font-semibold text-white">{index + 1}</span>
              <p className={`${typography.cardTitle} mt-3 text-foreground`}>{step.title}</p>
              <p className={`${typography.bodySmall} mt-1 text-[#4A4A4A]`}>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {project.activities.length > 0 && (
        <section aria-labelledby="volunteer-heading">
          <h2 id="volunteer-heading" className={`${typography.sectionTitle} text-foreground`}>Volunteer for this project</h2>
          <ul className="mt-4 divide-y divide-border rounded-2xl border-2 border-border">
            {project.activities.map((activity) => (
              <li key={activity.id}>
                <a href={activity.url} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/60">
                  <div className="min-w-0 flex-1">
                    <p className={`${typography.cardTitle} text-foreground`}>{activity.title}</p>
                    <p className={`${typography.metadata} mt-0.5 text-muted-foreground`}>
                      {[activity.track, activity.where].filter(Boolean).join(" · ") || "Volunteer activity"}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ProjectHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <ProjectDonate
          projectId={project.id}
          projectSlug={project.slug}
          items={project.items}
          volunteerSlug={volunteer ? v ?? null : null}
          itemsFunded={project.itemsFunded}
          itemsNeeded={project.itemsNeeded}
          amountRaised={project.amountRaised}
          supporterCount={project.supporterCount}
          supporters={project.supporters}
          intro={intro}
          outro={outro}
        />
      </main>
    </div>
  );
}
