import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import {
  createPublisherPortalStore,
  listPublisherMarcRecords,
  registerPublisherMarcRecord,
} from "@/lib/publisher-portal-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const publisherId = new URL(request.url).searchParams.get("publisherId") || undefined;
    const store = await createPublisherPortalStore();
    try {
      return NextResponse.json({
        marcRecords: await listPublisherMarcRecords(store, auth.user, { publisherId }),
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publisher MARC records are unavailable." },
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
        { marcRecord: await registerPublisherMarcRecord(store, auth.user, await request.json()) },
        { status: 201 },
      );
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Publisher MARC record could not be registered." },
      { status: 403 },
    );
  }
}
