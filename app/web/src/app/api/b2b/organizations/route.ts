import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { addOrganizationMember, createB2bQuoteStore, createOrganization, listOrganizations } from "@/lib/b2b-quote-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ organizations: await listOrganizations(store, session.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Organizations are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ organization: await createOrganization(store, session.user, await request.json()) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Organization creation failed." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ member: await addOrganizationMember(store, session.user, await request.json()) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Membership update failed." }, { status: 400 });
  }
}
