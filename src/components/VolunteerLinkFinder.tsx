"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, CardContent, Input } from "@omelora/sunrise";
import {
  APPLY_URL,
  fundraiseAbsoluteUrl,
} from "@/lib/givebutter";

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
        variant="elevated"
        className="w-full border border-border px-6 py-10 shadow-md sm:px-8 sm:py-12"
      >
        <CardContent className="flex flex-col gap-6 p-0">
          <div className="flex flex-col items-center gap-2.5 text-center">
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              Find Fundraiser Link
            </h1>
            <p className="text-base font-medium text-muted-foreground sm:text-lg">
              Enter your email to find your personal link.
            </p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Volunteer Email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="bg-background"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold"
              disabled={result.status === "loading"}
            >
              {result.status === "loading" ? "Looking up…" : "Find Link"}
            </Button>
          </form>

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
        <Card
          variant="elevated"
          className="w-full border border-border px-6 py-6 shadow-md sm:px-8"
        >
          <CardContent className="flex flex-col gap-3 p-0">
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Your Fundraiser Link
              </p>
              <p
                className="mt-1 truncate font-mono text-sm text-foreground"
                title={fundraiseAbsoluteUrl(result.slug)}
              >
                {result.linkDisplay}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Share this link. Every donation counts toward your hours.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="w-full font-semibold text-white shadow-sm hover:opacity-90 sm:flex-1"
                style={{ backgroundColor: "#09b5ff" }}
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
