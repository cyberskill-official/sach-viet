import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createPublisherPortalStore, withdrawPublishingRequest } from "@/lib/publisher-portal-core.mjs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const store = await createPublisherPortalStore();
    try {
      return NextResponse.json({
        publishingRequest: await withdrawPublishingRequest(store, auth.user, {
          requestId: id,
          publisherId: body?.publisherId,
        }),
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing request could not be withdrawn." },
      { status: 403 },
    );
  }
}
