import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createEmployeeRetailStore, listHomeSections, upsertHomeSection } from "@/lib/employee-retail-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createEmployeeRetailStore();
    try {
      return NextResponse.json({ sections: await listHomeSections(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Home sections are unavailable." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await request.json();
    const store = await createEmployeeRetailStore();
    try {
      return NextResponse.json({ section: await upsertHomeSection(store, auth.user, body) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Home section write failed." }, { status: 403 });
  }
}
