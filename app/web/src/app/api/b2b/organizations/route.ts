import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { addOrganizationMember, createB2bQuoteStore, createOrganization, listOrganizations } from "@/lib/b2b-quote-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ organizations: await listOrganizations(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Organizations are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ organization: await createOrganization(store, auth.user, await request.json()) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Organization creation failed." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ member: await addOrganizationMember(store, auth.user, await request.json()) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Membership update failed." }, { status: 400 });
  }
}
