import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createGoodsRequest, createSupportStore, listGoodsRequests } from "@/lib/support-core.mjs";

async function sessionFor(request: Request) { return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET); }

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createSupportStore();
    try { return NextResponse.json({ goodsRequests: await listGoodsRequests(store, session.user) }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Goods requests could not be read." }, { status: 400 }); }
}

export async function POST(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createSupportStore();
    try { return NextResponse.json({ goodsRequest: await createGoodsRequest(store, session.user, await request.json()) }, { status: 201 }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Goods request could not be created." }, { status: 400 }); }
}
