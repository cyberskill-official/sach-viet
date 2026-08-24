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
import { createCatalogStore, listVendorOffers, writeVendorOffer } from "@/lib/catalog-core.mjs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const url = new URL(request.url);
    const store = await createCatalogStore();
    try {
      const page = await listVendorOffers(store, auth.user, {
        vendorId: url.searchParams.get("vendorId") || undefined,
        after: url.searchParams.get("after") || undefined,
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 24,
      });
      return jsonPage(page.items, page.nextCursor);
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vendor offers are unavailable.";
    if (/not configured|AUTH_SESSION_SECRET/i.test(message)) {
      return jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", { status: 503, requestId });
    }
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid offer request.", { status: 400, requestId });
    const store = await createCatalogStore();
    try {
      const payload = { ...body, vendorId: body.vendorId || auth.user.id };
      return jsonOk({ offer: await writeVendorOffer(store, auth.user, payload) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Offer write failed.";
    if (/not configured|AUTH_SESSION_SECRET/i.test(message)) {
      return jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", { status: 503, requestId });
    }
    return jsonError(API_ERROR_CODES.forbidden, message, { status: errorStatusForMessage(message, 403), requestId });
  }
}
