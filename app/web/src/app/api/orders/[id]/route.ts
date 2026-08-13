import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { API_ERROR_CODES, createRequestId, errorStatusForMessage, jsonError, jsonOk } from "@/lib/api-contract.mjs";
import { createCommerceStore, getCustomerOrder } from "@/lib/commerce-core.mjs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId(request);
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const { id } = await context.params;
    const store = await createCommerceStore();
    try {
      return jsonOk({ order: await getCustomerOrder(store, session.user, id) });
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
