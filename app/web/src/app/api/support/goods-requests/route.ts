import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createGoodsRequest, createSupportStore, listGoodsRequests } from "@/lib/support-core.mjs";

function sessionFor(request: Request) { return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET); }

export async function GET(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createSupportStore();
    try { return NextResponse.json({ goodsRequests: listGoodsRequests(store, session.user) }); } finally { store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Goods requests could not be read." }, { status: 400 }); }
}

export async function POST(request: Request) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createSupportStore();
    try { return NextResponse.json({ goodsRequest: createGoodsRequest(store, session.user, await request.json()) }, { status: 201 }); } finally { store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Goods request could not be created." }, { status: 400 }); }
}
