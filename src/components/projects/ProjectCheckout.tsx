"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ensureGivebutterEventBridge } from "@/lib/givebutter-events";
import { GIVEBUTTER_WIDGET_ID } from "@/lib/givebutter";
import { formatUsd } from "@/lib/format";
import { typography } from "@/styles/typography";

/**
 * Embeds Givebutter. The browser's "donation complete" event only shows a
 * thank-you here; the gift is confirmed by Givebutter's webhook, not by this.
 */
export function ProjectCheckout({ total, projectSlug }: { total: number; projectSlug: string }) {
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const givebutter = ensureGivebutterEventBridge();
    givebutter("addEventListener", givebutter.EVENT.DONATION.COMPLETE, () => setFinished(true));
  }, []);

  if (finished) {
    return (
      <div className="mt-5 rounded-xl border-2 border-border p-5 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" aria-hidden />
        <p className="mt-2 text-lg font-semibold text-foreground">Thank you!</p>
        <p className={`${typography.bodySmall} mt-1 text-muted-foreground`}>
          Your gift will show on the project once Givebutter confirms it, usually within a few minutes.
        </p>
        <Link href={`/projects/${projectSlug}`} className={`mt-4 inline-flex h-10 items-center rounded-lg px-4 ${typography.button} ${typography.buttonPrimary}`}>
          Back to the project
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <p className={`${typography.bodySmall} mb-3 text-muted-foreground`}>
        Please keep the amount at {formatUsd(total)} and use the same email so we can match your gift to these items.
      </p>
      <div className="[&_givebutter-widget]:block [&_givebutter-widget]:w-full">
        <givebutter-widget id={GIVEBUTTER_WIDGET_ID} />
      </div>
    </div>
  );
}
