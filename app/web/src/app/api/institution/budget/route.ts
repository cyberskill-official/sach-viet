import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import {
  createInstitutionBuyerStore,
  getInstitutionBudget,
  upsertInstitutionBudget,
} from "@/lib/institution-buyer-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const organizationId = new URL(request.url).searchParams.get("organizationId") || undefined;
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ budget: await getInstitutionBudget(store, auth.user, { organizationId }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Budget is unavailable." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createInstitutionBuyerStore();
    try {
      return NextResponse.json({ budget: await upsertInstitutionBudget(store, auth.user, await request.json()) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Budget update failed." }, { status: 400 });
  }
}
