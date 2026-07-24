import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { addTicketMessage, createSupportStore, listTicketMessages } from "@/lib/support-core.mjs";

type Context = { params: Promise<{ id: string }> };

function sessionFor(request: Request) { return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET); }

export async function GET(request: Request, context: Context) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createSupportStore();
    try { return NextResponse.json({ messages: listTicketMessages(store, session.user, (await context.params).id) }); } finally { store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ticket messages could not be read." }, { status: 400 }); }
}

export async function POST(request: Request, context: Context) {
  try {
    const session = sessionFor(request);
    if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    const store = createSupportStore();
    try { return NextResponse.json({ message: addTicketMessage(store, session.user, { ...(await request.json()), ticketId: (await context.params).id }) }, { status: 201 }); } finally { store.close(); }
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ticket message could not be created." }, { status: 400 }); }
}
