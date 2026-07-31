import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent } from "@omelora/sunrise";
import DonateFaq from "@/components/DonateFaq";
import DonateFooter from "@/components/DonateFooter";
import DonateHeader from "@/components/DonateHeader";
import DonationSidebar from "@/components/DonationSidebar";
import FundraisingProgress from "@/components/FundraisingProgress";
import RecentDonations from "@/components/RecentDonations";
import ShareButton from "@/components/ShareButton";
import {
  getPersonBySlug,
  getPersonFundraisingStats,
} from "@/lib/airtable";
import { FUNDRAISE_HOST } from "@/lib/givebutter";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPersonBySlug(slug).catch(() => null);
  if (!person) {
    return { title: "Volunteer not found | Omelora" };
  }
  const firstName = person.firstName || person.displayName;
  return {
    title: `Support ${firstName}'s Fundraiser`,
    description: `Support ${person.displayName}'s fundraiser for Omelora. Your donation helps expand youth education programs worldwide.`,
  };
}

export default async function VolunteerFundraisePage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug).catch((error) => {
    console.error("[slug page] person lookup failed:", error);
    return null;
  });

  if (!person) notFound();

  const firstName = person.firstName || person.displayName;
  const fullName = person.displayName;
  const { amountRaised, recentDonations } = await getPersonFundraisingStats(
    person.id
  ).catch((error) => {
    console.error("[slug page] fundraising stats failed:", error);
    return { amountRaised: 0, recentDonations: [] };
  });

  const shareUrl =
    typeof process.env.NEXT_PUBLIC_SITE_URL === "string" &&
    process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/${slug}`
      : `https://${FUNDRAISE_HOST}/${slug}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DonateHeader />

      <main className="bg-background">
        <div className="mx-auto max-w-6xl px-6 pb-10 pt-14">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-6">
            {/* On mobile/medium: shared max width matching donation box. On lg: unwrap into grid. */}
            <div className="mx-auto flex w-full max-w-md flex-col gap-6 lg:contents">
              <h1 className="text-center text-[1.75rem] font-bold leading-tight tracking-tight text-foreground sm:text-[1.9rem] lg:col-start-1 lg:text-left lg:text-[2.15rem] xl:text-[2.5rem]">
                Support {firstName}&apos;s Fundraiser
              </h1>

              <Card
                variant="default"
                className="w-full border-2 shadow-sm lg:col-start-1"
              >
                <CardContent className="p-0">
                  <FundraisingProgress amountRaised={amountRaised} />
                </CardContent>
              </Card>

              <aside className="w-full min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:max-w-lg lg:justify-self-end">
                <Card variant="default" className="w-full border-2 shadow-sm">
                  <CardContent className="flex flex-col gap-6 p-0">
                    <DonationSidebar slug={slug} volunteerName={fullName} />
                    <ShareButton url={shareUrl} />

                    <p className="text-base text-muted-foreground">
                      Want to learn more? Email{" "}
                      <a
                        href="mailto:contact@omelora.org"
                        className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
                      >
                        contact@omelora.org
                      </a>
                      .
                    </p>

                    <RecentDonations donations={recentDonations} />
                  </CardContent>
                </Card>
              </aside>
            </div>

            <section className="mx-auto flex w-full max-w-md flex-col gap-6 lg:col-start-1 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/classroom.png"
                  alt="Students in an Omelora-supported classroom"
                  className="aspect-[2/1] w-full rounded-xl object-cover"
                />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Meddraphil Foundation of Uganda. Omelora supports places like
                  these.
                </p>
              </div>

              <ul className="flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-foreground sm:text-lg">
                <li>
                  <strong>Expand youth education access</strong> so more
                  students can learn, create, and lead in their communities.
                </li>
                <li>
                  <strong>Fund learning materials and chapter programs</strong>{" "}
                  that help young people thrive around the world.
                </li>
                <li>
                  <strong>Grow a youth-led movement</strong> of volunteers
                  building opportunity through Omelora.
                </li>
                <li>
                  <strong>
                    Credit every gift to {firstName}&apos;s fundraiser
                  </strong>{" "}
                  so their outreach directly powers this impact.
                </li>
              </ul>
            </section>
          </div>

          <div className="mt-10">
            <DonateFaq />
          </div>
        </div>
      </main>

      <DonateFooter />
    </div>
  );
}
