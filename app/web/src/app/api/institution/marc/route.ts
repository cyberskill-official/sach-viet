import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createInstitutionBuyerStore, listInstitutionMarcRecords } from "@/lib/institution-buyer-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ marcRecords: await listInstitutionMarcRecords(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "MARC records are unavailable." }, { status: 403 });
  }
}
