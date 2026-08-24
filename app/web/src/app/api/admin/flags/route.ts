import { API_ERROR_CODES, createRequestId, jsonError, jsonOk } from "@/lib/api-contract.mjs";
import { requirePermission } from "@/lib/authz-http.mjs";
import { commerceMutationsEnabled } from "@/lib/commerce-kill-switch.mjs";
import { getIntegrationStatus } from "@/lib/email-zalo-integrations-core.mjs";
import { createNotificationStore } from "@/lib/notification-core.mjs";
import { getSearchBackendStatus } from "@/lib/vietnamese-search-core.mjs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requirePermission(request, "admin.flags", {
      message: "Administrator access is required.",
    });
    if (!auth.ok) return auth.response;

    const store = await createNotificationStore();
    try {
      return jsonOk({
        flags: {
          commerceMutationsEnabled: commerceMutationsEnabled(process.env),
          search: getSearchBackendStatus(),
          integrations: getIntegrationStatus(store, auth.user),
        },
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flags are unavailable.";
    const status = /Admin access|Administrator|Access denied/i.test(message)
      ? 403
      : /not configured|AUTH_SESSION_SECRET/i.test(message)
        ? 503
        : 403;
    const code = status === 503 ? API_ERROR_CODES.not_configured : API_ERROR_CODES.forbidden;
    return jsonError(code, message, { status, requestId });
  }
}
