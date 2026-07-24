import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createB2bQuoteStore, listQuotesPipeline } from "@/lib/b2b-quote-core.mjs";

function sessionFor(request: Request) {
  return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createB2bQuoteStore();
    try {
      return NextResponse.json({ pipeline: listQuotesPipeline(store, session.user) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quote pipeline is unavailable." }, { status: 403 });
  }
}
