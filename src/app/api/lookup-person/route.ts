import { NextResponse } from "next/server";
import { getPersonByEmail } from "@/lib/peopleCache";
import { fundraiseDisplayUrl } from "@/lib/givebutter";

type LookupBody = {
  email?: unknown;
};

export async function POST(request: Request) {
  let body: LookupBody;

  try {
    body = (await request.json()) as LookupBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Email is required" },
      { status: 400 }
    );
  }

  try {
    const person = await getPersonByEmail(email);
    if (!person) {
      return NextResponse.json({ ok: true, found: false });
    }

    return NextResponse.json({
      ok: true,
      found: true,
      person: {
        id: person.id,
        displayName: person.displayName,
        firstName: person.firstName,
        lastName: person.lastName,
        slug: person.slug,
        linkDisplay: fundraiseDisplayUrl(person.slug),
      },
    });
  } catch (error) {
    console.error("[lookup-person] failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to look up email",
      },
      { status: 500 }
    );
  }
}
