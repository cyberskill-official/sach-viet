import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { addWishlistItem, createWishlistStore, listWishlist, removeWishlistItem } from "@/lib/wishlist-core.mjs";

async function sessionFor(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  return readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createWishlistStore();
    try {
      return NextResponse.json({ items: await listWishlist(store, session.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wishlist is unavailable." },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const body = await request.json().catch(() => null);
    const store = await createWishlistStore();
    try {
      return NextResponse.json({ item: await addWishlistItem(store, session.user, body?.productId) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wishlist update failed." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") || (await request.json().catch(() => null))?.productId;
    const store = await createWishlistStore();
    try {
      return NextResponse.json(await removeWishlistItem(store, session.user, productId));
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wishlist update failed." },
      { status: 400 },
    );
  }
}
