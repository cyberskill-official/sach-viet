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
import { createEmployeeRetailStore, listRetailOrders, setRetailOrderItemFulfillment } from "@/lib/employee-retail-core.mjs";

async function sessionFor(request: Request) {
  const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
  return await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
}

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const url = new URL(request.url);
    const store = await createEmployeeRetailStore();
    try {
      const page = await listRetailOrders(store, session.user, {
        after: url.searchParams.get("after") || undefined,
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 50,
      });
      return jsonPage(page.items, page.nextCursor);
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Retail orders are unavailable.";
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}

export async function PATCH(request: Request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid fulfillment request.", { status: 400, requestId });
    const store = await createEmployeeRetailStore();
    try {
      return jsonOk({ fulfillment: await setRetailOrderItemFulfillment(store, session.user, body) });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fulfillment update failed.";
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}
