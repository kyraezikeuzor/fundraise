"use client";

import { useEffect, useState } from "react";
import {
  ensureGivebutterEventBridge,
  extractDonationAmount,
  extractDonationComment,
  extractDonorName,
  type GivebutterDonationEvent,
} from "@/lib/givebutter-events";
import { GIVEBUTTER_WIDGET_ID } from "@/lib/givebutter";

const BRAND_ORANGE = "#FF971E";

type LogState =
  | { status: "idle" }
  | { status: "logging" }
  | { status: "success"; amount: number }
  | { status: "error"; message: string };

type DonationWidgetProps = {
  slug: string;
  volunteerName: string;
};

/** Paint Givebutter CTA buttons full brand orange when DOM allows. */
function paintGivebutterCtas(root: ParentNode) {
  const nodes = root.querySelectorAll("button, [role='button'], a");
  nodes.forEach((node) => {
    const el = node as HTMLElement;
    const label = (el.textContent || "").trim().toLowerCase();
    if (!/^(continue|donate|give|next|pay|submit)/.test(label) && !label.includes("continue")) {
      return;
    }
    el.style.setProperty("background-color", BRAND_ORANGE, "important");
    el.style.setProperty("background", BRAND_ORANGE, "important");
    el.style.setProperty("border-color", BRAND_ORANGE, "important");
    el.style.setProperty("color", "#ffffff", "important");
    el.style.setProperty("opacity", "1", "important");
    el.style.setProperty("filter", "none", "important");
  });

  root.querySelectorAll("*").forEach((el) => {
    const host = el as HTMLElement & { shadowRoot?: ShadowRoot | null };
    if (host.shadowRoot) paintGivebutterCtas(host.shadowRoot);
  });
}

export default function DonationWidget({
  slug,
  volunteerName,
}: DonationWidgetProps) {
  const [logState, setLogState] = useState<LogState>({ status: "idle" });

  useEffect(() => {
    const paint = () => {
      const widget = document.querySelector("givebutter-widget");
      if (widget) paintGivebutterCtas(widget);
    };
    const observer = new MutationObserver(paint);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    paint();
    const t1 = window.setTimeout(paint, 600);
    const t2 = window.setTimeout(paint, 2000);

    return () => {
      observer.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const givebutter = ensureGivebutterEventBridge();
    let cancelled = false;

    // LIMITATION: donation.complete is a browser-side event and could be faked.
    // Fine for attributing volunteer fundraising credit; not for accounting.
    givebutter(
      "addEventListener",
      givebutter.EVENT.DONATION.COMPLETE,
      async (donationObj: GivebutterDonationEvent) => {
        // Confirm exact field names (comment, donor.name, etc.) from a real gift.
        console.log("[givebutter] donation.complete payload:", donationObj);

        if (cancelled) return;

        const amount = extractDonationAmount(donationObj);
        const comment = extractDonationComment(donationObj);
        const donorName = extractDonorName(donationObj);

        if (amount === null) {
          setLogState({
            status: "error",
            message:
              "Donation completed, but we could not read the amount from Givebutter.",
          });
          return;
        }

        setLogState({ status: "logging" });

        try {
          const res = await fetch("/api/log-donation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              slug,
              amount,
              total: donationObj.total ?? amount,
              comment: comment ?? null,
              donorName: donorName ?? null,
              frequency: donationObj.frequency ?? null,
              method: donationObj.method ?? null,
              sessionId: donationObj.sessionId ?? null,
              donationObj,
            }),
          });

          const data = (await res.json()) as {
            ok?: boolean;
            error?: string;
          };

          if (!res.ok || !data.ok) {
            throw new Error(data.error || "Failed to log donation");
          }

          if (!cancelled) {
            setLogState({ status: "success", amount });
          }
        } catch (error) {
          console.error("[givebutter] log-donation failed:", error);
          if (!cancelled) {
            setLogState({
              status: "error",
              message:
                error instanceof Error
                  ? error.message
                  : "Failed to log donation",
            });
          }
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
      <div className="flex w-full justify-center [&_givebutter-widget]:mx-auto [&_givebutter-widget]:block [&_givebutter-widget]:w-full">
        <givebutter-widget id={GIVEBUTTER_WIDGET_ID} />
      </div>

      {logState.status === "logging" && (
        <p className="w-full text-sm text-muted-foreground" role="status">
          Saving your donation credit for {volunteerName}…
        </p>
      )}

      {logState.status === "success" && (
        <div
          className="w-full rounded-lg border border-sunrise-200 bg-sunrise-50 px-3 py-3"
          role="status"
        >
          <h2 className="text-base font-bold text-foreground">Thank you!</h2>
          <p className="mt-1 text-sm leading-relaxed text-foreground">
            Your ${logState.amount.toFixed(2)} donation was logged in support of{" "}
            <strong>{volunteerName}</strong>. They&apos;ll get credit for
            encouraging your gift.
          </p>
        </div>
      )}

      {logState.status === "error" && (
        <p
          className="w-full rounded-lg border border-destructive/40 px-3 py-2.5 text-sm text-destructive"
          role="alert"
        >
          {logState.message}
        </p>
      )}
    </div>
  );
}
