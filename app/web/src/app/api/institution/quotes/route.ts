import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createB2bQuoteStore, listInstitutionQuotes, requestQuoteFromSelectionList } from "@/lib/b2b-quote-core.mjs";

function sessionFor(request: Request) {
  return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createB2bQuoteStore();
    try {
      return NextResponse.json({ quotes: listInstitutionQuotes(store, session.user) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quotes are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createB2bQuoteStore();
    try {
      return NextResponse.json({ quote: requestQuoteFromSelectionList(store, session.user, await request.json()) }, { status: 201 });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quote request failed." }, { status: 400 });
  }
}
