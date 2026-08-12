import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { addSelectionListItem, createB2bQuoteStore, createSelectionList, listSelectionLists } from "@/lib/b2b-quote-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ selectionLists: await listSelectionLists(store, session.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Selection lists are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json();
    const store = await createB2bQuoteStore();
    try {
      if (body?.selectionListId && body?.productId) {
        return NextResponse.json({ item: await addSelectionListItem(store, session.user, body) }, { status: 201 });
      }
      return NextResponse.json({ selectionList: await createSelectionList(store, session.user, body) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Selection list write failed." }, { status: 400 });
  }
}
