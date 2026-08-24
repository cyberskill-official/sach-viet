import { requireApiPermission } from "@/lib/authz-http.mjs";
import { API_ERROR_CODES, createRequestId, errorStatusForMessage, jsonError, jsonOk } from "@/lib/api-contract.mjs";
import { createCommerceStore, getCustomerOrder } from "@/lib/commerce-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const { id } = await context.params;
    const store = await createCommerceStore();
    try {
      return jsonOk({ order: await getCustomerOrder(store, auth.user, id) });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Order is unavailable.";
    if (/not configured|AUTH_SESSION_SECRET/i.test(message)) {
      return jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", { status: 503, requestId });
    }
    return jsonError(API_ERROR_CODES.not_found, message, { status: errorStatusForMessage(message, 404), requestId });
  }
}
