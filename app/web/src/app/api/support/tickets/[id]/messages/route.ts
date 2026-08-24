import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/authz-http.mjs";
import { addTicketMessage, createSupportStore, listTicketMessages } from "@/lib/support-core.mjs";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createSupportStore();
    try { return NextResponse.json({ message: await addTicketMessage(store, auth.user, { ...(await request.json()), ticketId: (await context.params).id }) }, { status: 201 }); } finally { await store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ticket message could not be created." }, { status: 400 }); }
}
