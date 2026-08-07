import DonateHeader from "@/components/DonateHeader";
import VolunteerLinkFinder from "@/components/VolunteerLinkFinder";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DonateHeader />

      <main className="min-h-[calc(100vh-8rem)] bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-6 pb-10 pt-14">
          <VolunteerLinkFinder />
        </div>
      </main>
    </div>
  );
}
