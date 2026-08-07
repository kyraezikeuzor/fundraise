"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, LogIn } from "lucide-react";
import { Button } from "@omelora/sunrise";
import { LOGO_URL } from "@/lib/format";

const WEBSITE_URL = "https://omelora.org";
const BRIDGE_URL = "https://bridge.omelora.org";

export default function DonateHeader() {
  const pathname = usePathname();
  const isDonatePage = pathname !== "/";
  const contentWidth = isDonatePage ? "max-w-5xl" : "max-w-6xl";
  const contentPad = isDonatePage ? "px-5 sm:px-8 lg:px-10" : "px-6";

  const description = isDonatePage
    ? "Share and raise. Questions? Email "
    : "Get your fundraiser link. Questions? Email ";

  return (
    <header className="bg-background">
      {/* Top bar */}
      <div className="border-b border-border bg-muted">
        <div
          className={`mx-auto flex ${contentWidth} items-center justify-center ${contentPad} py-2`}
        >
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
          >
            Visit Omelora.org
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-border">
        <div
          className={`mx-auto flex ${contentWidth} flex-col gap-4 ${contentPad} py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6`}
        >          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="shrink-0" aria-label="Omelora Fundraise home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_URL}
                alt=""
                className="h-11 w-11 rounded-xl object-cover shadow-sm"
              />
            </Link>
            <div className="min-w-0">
              <Link
                href="/"
                className="text-lg font-bold leading-tight text-foreground hover:opacity-80"
              >
                Fundraise
              </Link>
              <p className="text-sm leading-snug text-muted-foreground">
                {description}
                <a
                  href="mailto:volunteer@omelora.org"
                  className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
                >
                  volunteer@omelora.org
                </a>
                .
              </p>
            </div>
          </div>

          {!isDonatePage ? (
            <a
              href={BRIDGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 self-start sm:self-center"
            >
              <Button type="button" variant="outline" className="gap-2">
                <LogIn className="h-4 w-4" aria-hidden />
                Sign In to Bridge
              </Button>
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}
