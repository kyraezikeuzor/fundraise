"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, CardContent, Input } from "@omelora/sunrise";
import { APPLY_URL, fundraiseAbsoluteUrl } from "@/lib/givebutter";

const STEPS = [
  "Enter your Omelora email",
  "Get your personal fundraiser link",
  "Share it with your community",
] as const;

type LookupResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not_found" }
  | {
      status: "found";
      displayName: string;
      slug: string;
      linkDisplay: string;
    }
  | { status: "error"; message: string };

export default function VolunteerLinkFinder() {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState<LookupResult>({ status: "idle" });
  const [copied, setCopied] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setCopied(false);
    setResult({ status: "loading" });

    try {
      const res = await fetch("/api/lookup-person", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        found?: boolean;
        error?: string;
        person?: {
          displayName: string;
          slug: string;
          linkDisplay: string;
        };
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Lookup failed");
      }

      if (!data.found || !data.person) {
        setResult({ status: "not_found" });
        return;
      }

      setResult({
        status: "found",
        displayName: data.person.displayName,
        slug: data.person.slug,
        linkDisplay: data.person.linkDisplay,
      });
    } catch (error) {
      setResult({
        status: "error",
        message:
          error instanceof Error ? error.message : "Something went wrong",
      });
    }
  }

  async function copyLink(slug: string) {
    const url = fundraiseAbsoluteUrl(slug);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-[500px] flex-col gap-4">
      <Card
        variant="default"
        className="w-full border-2 px-5 py-8 shadow-sm sm:px-6 sm:py-10"
      >
        <CardContent className="flex flex-col gap-6 p-0">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              Grab your fundraiser link
            </h1>
            <p className="text-base font-medium text-muted-foreground sm:text-lg">
              Every $10 raised earns you 1 volunteer hour
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <h2 className="text-base font-semibold text-foreground">
              How it works
            </h2>
            <ol className="flex flex-col gap-2">
              {STEPS.map((step, index) => (
                <li key={step} className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                    {index + 1}
                  </div>
                  <p className="text-base font-medium leading-snug text-foreground">
                    {step}
                  </p>
                </li>
              ))}
            </ol>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Enter your email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold"
              disabled={result.status === "loading"}
            >
              {result.status === "loading" ? "Looking up…" : "Get My Link"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Questions? Email{" "}
            <a
              href="mailto:volunteer@omelora.org"
              className="font-medium text-primary underline underline-offset-2 hover:opacity-80"
            >
              volunteer@omelora.org
            </a>
          </p>

          {result.status === "not_found" && (
            <p className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground">
              We couldn&apos;t find a volunteer profile for this email.{" "}
              <a
                href={APPLY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-2"
              >
                Apply here
              </a>
              .
            </p>
          )}

          {result.status === "error" && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              {result.message}
            </p>
          )}
        </CardContent>
      </Card>

      {result.status === "found" && (
        <Card variant="default" className="w-full border-2 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-0">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Your fundraiser link
              </p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">
                {result.linkDisplay}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Share this link so donations earn hours for {result.displayName}.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="primary"
                className="w-full font-semibold sm:flex-1"
                onClick={() => copyLink(result.slug)}
              >
                {copied ? "Copied!" : "Copy Link"}
              </Button>
              <a
                href={fundraiseAbsoluteUrl(result.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:flex-1"
              >
                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-medium"
                >
                  View My Page
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
