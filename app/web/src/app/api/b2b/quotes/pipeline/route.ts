import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createB2bQuoteStore, listQuotesPipeline } from "@/lib/b2b-quote-core.mjs";

export async function GET(request: Request) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ pipeline: await listQuotesPipeline(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quote pipeline is unavailable." }, { status: 403 });
  }
}
