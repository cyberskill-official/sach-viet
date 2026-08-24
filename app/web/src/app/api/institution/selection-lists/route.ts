import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { addSelectionListItem, createB2bQuoteStore, createSelectionList, listSelectionLists } from "@/lib/b2b-quote-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ selectionLists: await listSelectionLists(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Selection lists are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const store = await createB2bQuoteStore();
    try {
      if (body?.selectionListId && body?.productId) {
        return NextResponse.json({ item: await addSelectionListItem(store, auth.user, body) }, { status: 201 });
      }
      return NextResponse.json({ selectionList: await createSelectionList(store, auth.user, body) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Selection list write failed." }, { status: 400 });
  }
}
