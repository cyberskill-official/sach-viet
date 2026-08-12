import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createInstitutionBuyerStore, listInstitutionMarcRecords } from "@/lib/institution-buyer-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(await getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  try {
    const session = await sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ marcRecords: await listInstitutionMarcRecords(store, session.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "MARC records are unavailable." }, { status: 403 });
  }
}
