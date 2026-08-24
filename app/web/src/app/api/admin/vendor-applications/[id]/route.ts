import { createAdminCommerceStore, resolveVendorApplication } from "@/lib/admin-commerce-core.mjs";
import { API_ERROR_CODES, createRequestId, errorStatusForMessage, jsonError, jsonOk, readJsonBody } from "@/lib/api-contract.mjs";
import { requirePermission } from "@/lib/authz-http.mjs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId(request);
  try {
    const auth = await requirePermission(request, "admin.vendors.review", {
      message: "Administrator access is required.",
    });
    if (!auth.ok) return auth.response;

    const body = await readJsonBody(request);
    if (!body) {
      return jsonError(API_ERROR_CODES.invalid_request, "Invalid vendor application request.", {
        status: 400,
        requestId: auth.requestId,
      });
    }

    const store = await createAdminCommerceStore();
    try {
      return jsonOk({
        application: await resolveVendorApplication(store, auth.user, {
          ...body,
          applicationId: (await params).id,
        }),
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vendor application could not be resolved.";
    return jsonError(API_ERROR_CODES.forbidden, message, {
      status: errorStatusForMessage(message),
      requestId,
    });
  }
}
