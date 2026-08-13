import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createReview, createSupportStore } from "@/lib/support-core.mjs";

async function sessionFor(request: Request) { return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET); }

export async function POST(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createSupportStore();
    try { return NextResponse.json({ review: await createReview(store, session.user, await request.json()) }, { status: 201 }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Review could not be created." }, { status: 400 }); }
}
