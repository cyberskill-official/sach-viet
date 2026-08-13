import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createInstitutionBuyerStore, submitInstitutionPurchaseOrder } from "@/lib/institution-buyer-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { id } = await context.params;
    const body = await request.json();
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({
        submission: await submitInstitutionPurchaseOrder(store, session.user, {
          ...body,
          orderId: id,
        }),
      }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Purchase order submission failed." }, { status: 400 });
  }
}
