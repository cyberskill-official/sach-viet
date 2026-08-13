import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { API_ERROR_CODES, createRequestId, jsonError, jsonPage } from "@/lib/api-contract.mjs";
import { createCommerceStore, listCustomerOrders } from "@/lib/commerce-core.mjs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const store = await createCommerceStore();
    try {
      const url = new URL(request.url);
      const after = url.searchParams.get("after") ?? undefined;
      const limitParam = url.searchParams.get("limit");
      const limit = limitParam ? Number(limitParam) : 50;
      const page = await listCustomerOrders(store, session.user, { after, limit });
      return jsonPage(page.items, page.nextCursor);
    } finally {
      await store.close();
    }
  } catch {
    return jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", { status: 503, requestId });
  }
}
