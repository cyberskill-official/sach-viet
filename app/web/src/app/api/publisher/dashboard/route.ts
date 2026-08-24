import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createPublisherPortalStore, getPublisherDashboard } from "@/lib/publisher-portal-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const publisherId = new URL(request.url).searchParams.get("publisherId") || undefined;
    const store = await createPublisherPortalStore();
    try {
      return NextResponse.json({ dashboard: await getPublisherDashboard(store, auth.user, { publisherId }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publisher dashboard is unavailable." },
      { status: 403 },
    );
  }
}
