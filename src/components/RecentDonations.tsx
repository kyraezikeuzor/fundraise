import type { Donation } from "@/lib/airtable";
import {
  donorInitials,
  formatRelativeTime,
  formatUsd,
} from "@/lib/format";

export default function RecentDonations({
  donations,
}: {
  donations: Donation[];
}) {
  return (
    <div>
      <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
        Recent Donations
      </h3>

      {donations.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No donations yet — be the first to give.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {donations.map((donation) => (
            <li key={donation.id} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white"
                aria-hidden
              >
                {donorInitials(donation.donorName)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {donation.donorName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeTime(donation.donationDate)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-foreground">
                {formatUsd(donation.value)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
