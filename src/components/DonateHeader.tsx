"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LOGO_URL } from "@/lib/format";

const WEBSITE_URL = "https://omelora.org";
const VOLUNTEER_URL = "https://form.fillout.com/t/2VfsyEfiduus";
const CHAPTER_URL = "https://form.fillout.com/t/de4P1gNPHDus";
const DONATE_URL = "https://donate.omelora.org";

const NAV_LINKS = [
  { label: "Visit Website", href: WEBSITE_URL },
  { label: "Become a Volunteer", href: VOLUNTEER_URL },
  { label: "Start a Chapter", href: CHAPTER_URL },
] as const;

const linkClassName =
  "text-[15px] font-normal tracking-wide text-foreground transition-opacity hover:opacity-70 sm:text-[17px]";

const ctaClassName =
  "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:px-6 sm:py-2.5 sm:text-base";

export default function DonateHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  const cta = isHome
    ? { label: "Donate", href: DONATE_URL, external: true as const }
    : { label: "Fundraise", href: "/", external: false as const };

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center"
          aria-label="Omelora Fundraise home"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_URL}
            alt="Omelora"
            className="h-9 w-9 rounded-lg object-cover shadow-sm"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-x-5 md:flex lg:gap-x-6">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {link.label}
            </a>
          ))}
          {cta.external ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={ctaClassName}
              style={{ backgroundColor: "#f82c4e" }}
            >
              {cta.label}
            </a>
          ) : (
            <Link
              href={cta.href}
              className={ctaClassName}
              style={{ backgroundColor: "#f82c4e" }}
            >
              {cta.label}
            </Link>
          )}
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 md:hidden">
          {cta.external ? (
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className={ctaClassName}
              style={{ backgroundColor: "#f82c4e" }}
              onClick={() => setOpen(false)}
            >
              {cta.label}
            </a>
          ) : (
            <Link
              href={cta.href}
              className={ctaClassName}
              style={{ backgroundColor: "#f82c4e" }}
              onClick={() => setOpen(false)}
            >
              {cta.label}
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-foreground transition-colors hover:bg-muted"
          >
            {open ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {open ? (
        <nav className="border-t border-border bg-background px-6 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
