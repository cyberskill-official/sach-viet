import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import {
  API_ERROR_CODES,
  createRequestId,
  errorStatusForMessage,
  jsonError,
  jsonOk,
  jsonPage,
  readJsonBody,
} from "@/lib/api-contract.mjs";
import { createSupportStore, createTicket, listTickets } from "@/lib/support-core.mjs";

async function sessionFor(request: Request) {
  return await readSession(
    await getAuthStore(),
    request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1],
    process.env.AUTH_SESSION_SECRET,
  );
}

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const url = new URL(request.url);
    const store = await createSupportStore();
    try {
      const page = await listTickets(store, session.user, {
        after: url.searchParams.get("after") || undefined,
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 50,
      });
      return jsonPage(page.items, page.nextCursor);
    } finally {
      await store.close();
    }
  } catch {
    return jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", { status: 503, requestId });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid ticket request.", { status: 400, requestId });
    const store = await createSupportStore();
    try {
      return jsonOk({ ticket: await createTicket(store, session.user, body) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket creation failed.";
    return jsonError(API_ERROR_CODES.invalid_request, message, { status: errorStatusForMessage(message), requestId });
  }
}
