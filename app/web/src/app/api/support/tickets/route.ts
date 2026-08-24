import { requireApiPermission } from "@/lib/authz-http.mjs";
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

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const url = new URL(request.url);
    const store = await createSupportStore();
    try {
      const page = await listTickets(store, auth.user, {
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid ticket request.", { status: 400, requestId });
    const store = await createSupportStore();
    try {
      return jsonOk({ ticket: await createTicket(store, auth.user, body) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket creation failed.";
    return jsonError(API_ERROR_CODES.invalid_request, message, { status: errorStatusForMessage(message), requestId });
  }
}
