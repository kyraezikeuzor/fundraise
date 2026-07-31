import { FUNDRAISE_GOAL_USD, formatUsd } from "@/lib/format";

export default function FundraisingProgress({
  amountRaised,
}: {
  amountRaised: number;
}) {
  const progress = Math.min(
    100,
    FUNDRAISE_GOAL_USD > 0 ? (amountRaised / FUNDRAISE_GOAL_USD) * 100 : 0
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-base font-bold text-foreground sm:text-lg">
          {formatUsd(amountRaised)} Volunteer Raised
        </p>
        <p className="text-base font-bold text-foreground sm:text-lg">
          {formatUsd(FUNDRAISE_GOAL_USD)} Goal
        </p>
      </div>

      <div
        className="mt-2.5 h-7 overflow-hidden rounded-full bg-[#F1F1F1]"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Fundraising progress"
      >
        <div
          className="h-full rounded-full bg-[#FF5A5F] transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
