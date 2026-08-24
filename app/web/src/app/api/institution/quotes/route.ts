import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createB2bQuoteStore, listInstitutionQuotes, requestQuoteFromSelectionList } from "@/lib/b2b-quote-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ quotes: await listInstitutionQuotes(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quotes are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ quote: await requestQuoteFromSelectionList(store, auth.user, await request.json()) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quote request failed." }, { status: 400 });
  }
}
