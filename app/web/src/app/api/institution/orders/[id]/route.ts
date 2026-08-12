import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createB2bOrderStore, getInstitutionOrder } from "@/lib/b2b-order-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const store = await createB2bOrderStore();
    try {
      return NextResponse.json({ order: await getInstitutionOrder(store, session.user, id) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Order is unavailable." }, { status: 403 });
  }
}
