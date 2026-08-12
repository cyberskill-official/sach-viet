import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createCatalogStore, writeVendorOffer } from "@/lib/catalog-core.mjs";

export async function POST(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  let session;
  try {
    session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
  } catch {
    return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 });
  }
  if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid offer request." }, { status: 400 });
  const store = await createCatalogStore();
  try {
    return NextResponse.json({ offer: await writeVendorOffer(store, session.user, body) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Offer write failed." }, { status: 403 });
  } finally {
    await store.close();
  }
}
