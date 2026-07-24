import { NextResponse } from "next/server";
import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { createSupportStore, createTicket, listTickets } from "@/lib/support-core.mjs";

function sessionFor(request: Request) { return readSession(getAuthStore(), request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET); }
export async function GET(request: Request) { try { const session = sessionFor(request); if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 }); const store = createSupportStore(); try { return NextResponse.json({ tickets: listTickets(store, session.user) }); } finally { store.close(); } } catch { return NextResponse.json({ error: "Authentication is not configured." }, { status: 503 }); } }
export async function POST(request: Request) { try { const session = sessionFor(request); if (!session) return NextResponse.json({ error: "Unauthenticated." }, { status: 401 }); const store = createSupportStore(); try { return NextResponse.json({ ticket: createTicket(store, session.user, await request.json()) }, { status: 201 }); } finally { store.close(); } } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Ticket creation failed." }, { status: 400 }); } }
