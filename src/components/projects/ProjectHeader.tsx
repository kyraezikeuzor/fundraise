import { LOGO_URL } from "@/lib/format";
import { typography } from "@/styles/typography";

/** Same logo lockup as Bridge and Activities. Links back to omelora.org. */
export function ProjectHeader() {
  return (
    <header className="w-full border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <a href="https://omelora.org" className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Omelora" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <span className={`block ${typography.sectionTitle} text-foreground`}>Projects</span>
            <span className={`block ${typography.metadata} text-muted-foreground`}>Omelora</span>
          </div>
        </a>
      </div>
    </header>
  );
}
