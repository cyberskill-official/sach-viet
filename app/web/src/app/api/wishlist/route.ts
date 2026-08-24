import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { addWishlistItem, createWishlistStore, listWishlist, removeWishlistItem } from "@/lib/wishlist-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createWishlistStore();
    try {
      return NextResponse.json({ items: await listWishlist(store, auth.user) });
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => null);
    const store = await createWishlistStore();
    try {
      return NextResponse.json({ item: await addWishlistItem(store, auth.user, body?.productId) }, { status: 201 });
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") || (await request.json().catch(() => null))?.productId;
    const store = await createWishlistStore();
    try {
      return NextResponse.json(await removeWishlistItem(store, auth.user, productId));
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
