"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@omelora/sunrise";

export default function ShareButton({
  url,
  className,
}: {
  url: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Support this Omelora fundraiser",
          url,
        });
        return;
      }
    } catch {
      // Fall through to clipboard if share is cancelled/unavailable.
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={`gap-2 font-semibold ${className ?? "w-full"}`}
      onClick={onShare}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      {copied ? "Link copied!" : "Share"}
    </Button>
  );
}
