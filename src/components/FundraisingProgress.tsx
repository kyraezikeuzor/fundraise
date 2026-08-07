import { FUNDRAISE_GOAL_USD, formatUsd } from "@/lib/format";

export default function FundraisingProgress({
  amountRaised,
  className,
}: {
  amountRaised: number;
  className?: string;
}) {
  const progress = Math.min(
    100,
    FUNDRAISE_GOAL_USD > 0 ? (amountRaised / FUNDRAISE_GOAL_USD) * 100 : 0
  );
  const progressLabel = Math.round(progress);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {formatUsd(amountRaised)}
        </p>
        <p className="text-xs text-foreground sm:text-sm">
          {progressLabel}% of {formatUsd(FUNDRAISE_GOAL_USD)} goal
        </p>
      </div>

      <div
        className="mt-1.5 h-3.5 overflow-hidden rounded-full bg-[#F1F1F1]"
        role="progressbar"
        aria-valuenow={progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Fundraising progress"
      >
        <div
          className="h-full rounded-full bg-[#09b5ff] transition-[width]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
