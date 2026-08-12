import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createB2bQuoteStore, getStaffQuote, setQuoteItemPrices, transitionQuoteStatus } from "@/lib/b2b-quote-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ quote: await getStaffQuote(store, session.user, id) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quote is unavailable." }, { status: 403 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json();
    const store = await createB2bQuoteStore();
    try {
      if (Array.isArray(body?.items)) {
        return NextResponse.json({ quote: await setQuoteItemPrices(store, session.user, { quoteId: id, items: body.items }) });
      }
      return NextResponse.json({ quote: await transitionQuoteStatus(store, session.user, { quoteId: id, status: body?.status }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quote update failed." }, { status: 400 });
  }
}
