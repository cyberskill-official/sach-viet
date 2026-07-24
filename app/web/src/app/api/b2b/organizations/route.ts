import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { addOrganizationMember, createB2bQuoteStore, createOrganization, listOrganizations } from "@/lib/b2b-quote-core.mjs";

function sessionFor(request: Request) {
  return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createB2bQuoteStore();
    try {
      return NextResponse.json({ organizations: listOrganizations(store, session.user) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Organizations are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createB2bQuoteStore();
    try {
      return NextResponse.json({ organization: createOrganization(store, session.user, await request.json()) }, { status: 201 });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Organization creation failed." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createB2bQuoteStore();
    try {
      return NextResponse.json({ member: addOrganizationMember(store, session.user, await request.json()) }, { status: 201 });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Membership update failed." }, { status: 400 });
  }
}
