import Link from "next/link";
import { Button, Card, CardContent, PageShell } from "@omelora/sunrise";

export default function NotFound() {
  return (
    <PageShell className="bg-sunrise-50" constrain={false}>
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <Card variant="elevated" className="w-full max-w-md border border-border">
          <CardContent className="flex flex-col gap-4 p-2 sm:p-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Volunteer not found
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We couldn&apos;t find a volunteer for that fundraiser link. Check
              the URL, or grab your link from the homepage.
            </p>
            <Link href="/">
              <Button type="button" variant="primary" className="w-full">
                Get my fundraiser link
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
