import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import {
  API_ERROR_CODES,
  createRequestId,
  errorStatusForMessage,
  jsonError,
  jsonOk,
  readJsonBody,
} from "@/lib/api-contract.mjs";
import { assignTicket, createSupportStore } from "@/lib/support-core.mjs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId(request);
  try {
    const session = await readSession(
      await getAuthStore(),
      request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1],
      process.env.AUTH_SESSION_SECRET,
    );
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const { id } = await context.params;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid assignment request.", { status: 400, requestId });
    const store = await createSupportStore();
    try {
      return jsonOk({ ticket: await assignTicket(store, session.user, { ...body, ticketId: id }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket assignment failed.";
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}
