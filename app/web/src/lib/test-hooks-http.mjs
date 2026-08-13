import {
  API_ERROR_CODES,
  createRequestId,
  jsonError,
  jsonOk,
} from "./api-contract.mjs";
import { getAuthStore } from "./auth-core.mjs";
import { authorizeTestHook, readIdentityVerifyHookToken } from "./test-hooks-core.mjs";

export async function handleGetVerifyToken(request, env = process.env, { getStore = getAuthStore } = {}) {
  const requestId = createRequestId(request);
  const authz = authorizeTestHook(request.headers, env);
  if (!authz.ok) {
    const code = authz.status === 401 ? API_ERROR_CODES.unauthenticated : API_ERROR_CODES.not_found;
    return jsonError(code, authz.message, { status: authz.status, requestId });
  }

  const email = new URL(request.url).searchParams.get("email");
  const store = await getStore();
  const found = await readIdentityVerifyHookToken(store, email);
  if (!found) {
    return jsonError(API_ERROR_CODES.not_found, "Verification token is not available.", {
      status: 404,
      requestId,
    });
  }
  return jsonOk({ email: found.email, token: found.token });
}
