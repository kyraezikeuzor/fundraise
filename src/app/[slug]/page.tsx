import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Card, CardContent } from "@omelora/sunrise";
import DonateFaq from "@/components/DonateFaq";
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
  const fullName = person.displayName;
  return {
    title: `${fullName}'s Fundraiser`,
    description: `Support ${fullName}'s fundraiser for Omelora. Your donation helps expand youth education programs worldwide.`,
  };
}

export default async function VolunteerFundraisePage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPersonBySlug(slug).catch((error) => {
    console.error("[slug page] person lookup failed:", error);
    return null;
  });

  if (!person) notFound();

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
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-foreground"
      style={{ backgroundImage: "url(/donate-bg.png)" }}
    >
      <DonateHeader />

      <main>
        <div className="mx-auto max-w-5xl px-5 pb-10 pt-14 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-x-10">
            {/* On mobile/medium: shared max width matching donation box. On lg: unwrap into grid. */}
            <div className="mx-auto flex w-full max-w-md flex-col gap-8 lg:contents">
              <Card
                variant="elevated"
                className="relative w-full overflow-hidden !border-0 bg-background !p-0 !shadow-none sm:!p-0 lg:col-start-1"
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/fundraise-hero.jpg"
                    alt="Students holding books at an Omelora-supported school"
                    className="aspect-[2/1] w-full object-cover"
                  />
                  <ShareButton
                    url={shareUrl}
                    className="absolute right-3 top-3 z-10 w-auto bg-background/95 sm:right-4 sm:top-4"
                  />
                </div>
                <CardContent className="flex flex-col gap-2.5 px-6 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
                  <h1 className="min-w-0 text-left text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
                    {fullName}&apos;s Fundraiser
                  </h1>

                  <FundraisingProgress
                    amountRaised={amountRaised}
                    className="mb-2"
                  />

                  <p className="text-base leading-relaxed text-foreground sm:text-lg">
                    I&apos;m raising money for a cause that&apos;s important to
                    me. I volunteer at Omelora. We&apos;re a group of 3000 high
                    school and college students adapting education resources to
                    schools abroad to improve educational equality. Please
                    donate today to help me show support and keep our programs
                    running!
                  </p>

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
                </CardContent>
              </Card>

              <aside className="w-full min-w-0 lg:col-start-2 lg:row-start-1">
                <DonationSidebar slug={slug} volunteerName={fullName} />
              </aside>
            </div>
          </div>

          <div className="mt-10">
            <Card
              variant="elevated"
              className="w-full border border-white bg-background !p-6 !shadow-none sm:!p-8"
            >
              <CardContent className="p-0">
                <RecentDonations donations={recentDonations} />
              </CardContent>
            </Card>
          </div>

          <div className="mt-10">
            <Card
              variant="elevated"
              className="w-full border border-white bg-background !p-6 !shadow-none sm:!p-8"
            >
              <CardContent className="p-0">
                <DonateFaq />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
