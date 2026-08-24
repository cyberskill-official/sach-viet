import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { createB2bQuoteStore, getInstitutionQuote } from "@/lib/b2b-quote-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const store = await createB2bQuoteStore();
    try {
      return NextResponse.json({ quote: await getInstitutionQuote(store, auth.user, id) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Quote is unavailable." }, { status: 403 });
  }
}
