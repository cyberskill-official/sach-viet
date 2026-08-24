import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createReview, createSupportStore } from "@/lib/support-core.mjs";

export async function POST(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createSupportStore();
    try {
      return NextResponse.json(
        { review: await createReview(store, auth.user, await request.json()) },
        { status: 201 },
      );
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review could not be created." },
      { status: 400 },
    );
  }
}
