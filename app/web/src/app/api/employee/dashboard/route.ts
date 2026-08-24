import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createEmployeeRetailStore, getEmployeeDashboard } from "@/lib/employee-retail-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createEmployeeRetailStore();
    try {
      return NextResponse.json({ dashboard: await getEmployeeDashboard(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Employee dashboard is unavailable." }, { status: 403 });
  }
}
