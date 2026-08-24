import { requireApiPermission } from "@/lib/authz-http.mjs";
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid assignment request.", { status: 400, requestId });
    const store = await createSupportStore();
    try {
      return jsonOk({ ticket: await assignTicket(store, auth.user, { ...body, ticketId: id }) });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ticket assignment failed.";
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}
