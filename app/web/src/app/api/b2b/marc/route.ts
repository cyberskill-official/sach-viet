import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createInstitutionBuyerStore, registerInstitutionMarcRecord } from "@/lib/institution-buyer-core.mjs";

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ marcRecord: await registerInstitutionMarcRecord(store, auth.user, await request.json()) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "MARC registration failed." }, { status: 400 });
  }
}
