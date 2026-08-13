import { COOKIE_NAME, getAuthStore, readSession } from "@/lib/auth-core.mjs";
import { API_ERROR_CODES, createRequestId, jsonError, jsonOk } from "@/lib/api-contract.mjs";
import { commerceMutationsEnabled } from "@/lib/commerce-kill-switch.mjs";
import { getIntegrationStatus } from "@/lib/email-zalo-integrations-core.mjs";
import { createNotificationStore } from "@/lib/notification-core.mjs";
import { getSearchBackendStatus } from "@/lib/vietnamese-search-core.mjs";

export async function GET(request: Request) {
  const requestId = createRequestId(request);
  try {
    const token = request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1];
    const session = await readSession(await getAuthStore(), token, process.env.AUTH_SESSION_SECRET);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const store = await createNotificationStore();
    try {
      return jsonOk({
        flags: {
          commerceMutationsEnabled: commerceMutationsEnabled(process.env),
          search: getSearchBackendStatus(),
          integrations: getIntegrationStatus(store, session.user),
        },
      });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Flags are unavailable.";
    const status = /Admin access|Administrator/i.test(message) ? 403 : /not configured|AUTH_SESSION_SECRET/i.test(message) ? 503 : 403;
    const code = status === 503 ? API_ERROR_CODES.not_configured : API_ERROR_CODES.forbidden;
    return jsonError(code, message, { status, requestId });
  }
}
