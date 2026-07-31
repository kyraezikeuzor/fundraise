import DonationWidget from "@/components/DonationWidget";

type DonationSidebarProps = {
  slug: string;
  volunteerName: string;
};

export default function DonationSidebar({
  slug,
  volunteerName,
}: DonationSidebarProps) {
  return (
    <div className="w-full">
      <DonationWidget slug={slug} volunteerName={volunteerName} />
    </div>
  );
}
