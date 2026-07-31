import { Mail } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/format";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8.5h4V23h-4V8.5zM8.5 8.5h3.8v2h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V23h-4v-6.6c0-1.57-.03-3.59-2.19-3.59-2.19 0-2.53 1.71-2.53 3.48V23h-4V8.5z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.73a8.19 8.19 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15Z" />
    </svg>
  );
}

const LINKS = [
  {
    label: "Instagram",
    href: SOCIAL_LINKS.instagram,
    icon: InstagramIcon,
  },
  {
    label: "LinkedIn",
    href: SOCIAL_LINKS.linkedin,
    icon: LinkedInIcon,
  },
  {
    label: "TikTok",
    href: SOCIAL_LINKS.tiktok,
    icon: TikTokIcon,
  },
  {
    label: "Email",
    href: SOCIAL_LINKS.email,
    icon: Mail,
  },
] as const;

export default function DonateFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="text-white" style={{ backgroundColor: "#f82c4e" }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-wrap gap-3">
          {LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={
                href.startsWith("mailto:") ? undefined : "noopener noreferrer"
              }
              className="inline-flex items-center gap-2.5 rounded-md border border-white/80 px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              <Icon className="h-5 w-5" />
              {label}
            </a>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/25 pt-5 text-sm text-white/90 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Omelora. All rights reserved.</p>
          <a
            href="mailto:contact@omelora.org"
            className="hover:text-white hover:underline"
          >
            contact@omelora.org
          </a>
        </div>
      </div>
    </footer>
  );
}
