import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import {
  createPublisherPortalStore,
  createPublishingRequest,
  listPublishingRequests,
} from "@/lib/publisher-portal-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const publisherId = new URL(request.url).searchParams.get("publisherId") || undefined;
    const store = await createPublisherPortalStore();
    try {
      return NextResponse.json({
        publishingRequests: await listPublishingRequests(store, auth.user, { publisherId }),
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing requests are unavailable." },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createPublisherPortalStore();
    try {
      return NextResponse.json(
        { publishingRequest: await createPublishingRequest(store, auth.user, await request.json()) },
        { status: 201 },
      );
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publishing request could not be created." },
      { status: 403 },
    );
  }
}
