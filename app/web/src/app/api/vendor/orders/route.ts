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
import { createVendorCommerceStore, listVendorIncomingOrders, setOrderItemFulfillment } from "@/lib/vendor-commerce-core.mjs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const url = new URL(request.url);
    const store = await createVendorCommerceStore();
    try {
      const page = await listVendorIncomingOrders(store, auth.user, {
        vendorId: url.searchParams.get("vendorId") || undefined,
        after: url.searchParams.get("after") || undefined,
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 50,
      });
      return jsonPage(page.items, page.nextCursor);
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vendor orders are unavailable.";
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}

export async function PATCH(request: Request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid fulfillment request.", { status: 400, requestId });
    const store = await createVendorCommerceStore();
    try {
      return jsonOk({ fulfillment: await setOrderItemFulfillment(store, auth.user, body) });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fulfillment update failed.";
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}
