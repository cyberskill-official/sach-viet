import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createInstitutionBuyerStore, getInstitutionMarcRecord } from "@/lib/institution-buyer-core.mjs";

function sessionFor(request: Request) {
  return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request, context: { params: Promise<{ productId: string }> }) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const { productId } = await context.params;
    const store = createInstitutionBuyerStore();
    try {
      return NextResponse.json({ marcRecord: getInstitutionMarcRecord(store, session.user, productId) });
    } finally {
      store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "MARC record is unavailable." }, { status: 403 });
  }
}
