import { COOKIE_NAME, getAuthStore, readSession } from "./auth-core.mjs";
import {
  changeAccountPassword,
  createAccountStore,
  createAddress,
  deleteAddress,
  getAccount,
  listAddresses,
  updateAccount,
} from "./account-core.mjs";
import {
  API_ERROR_CODES,
  createRequestId,
  errorStatusForMessage,
  jsonError,
  jsonOk,
  jsonPage,
  readJsonBody,
  sessionTokenFrom,
} from "./api-contract.mjs";

async function sessionFor(request) {
  return await readSession(await getAuthStore(), sessionTokenFrom(request) || request.headers.get("cookie")?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))?.[1], process.env.AUTH_SESSION_SECRET);
}

function fail(error, requestId, fallback = API_ERROR_CODES.invalid_request) {
  const message = error instanceof Error ? error.message : "Account request failed.";
  if (/not configured|AUTH_SESSION_SECRET/i.test(message)) {
    return jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", { status: 503, requestId });
  }
  return jsonError(fallback, message, { status: errorStatusForMessage(message), requestId });
}

export async function handleGetAccount(request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk({ account: await getAccount(store, session.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId);
  }
}

export async function handleUpdateAccount(request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid account request.", { status: 400, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk({ account: await updateAccount(store, session.user, body) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId);
  }
}

export async function handleChangeAccountPassword(request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid password request.", { status: 400, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk(await changeAccountPassword(store, session.user, body));
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId);
  }
}

export async function handleListAddresses(request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const url = new URL(request.url);
    const store = await createAccountStore();
    try {
      const page = await listAddresses(store, session.user, {
        after: url.searchParams.get("after") || undefined,
        limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : 24,
      });
      return jsonPage(page.items, page.nextCursor);
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId);
  }
}

export async function handleCreateAddress(request) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid address request.", { status: 400, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk({ address: await createAddress(store, session.user, body) }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId);
  }
}

export async function handleDeleteAddress(request, addressId) {
  const requestId = createRequestId(request);
  try {
    const session = await sessionFor(request);
    if (!session) return jsonError(API_ERROR_CODES.unauthenticated, "Unauthenticated.", { status: 401, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk(await deleteAddress(store, session.user, addressId));
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId, API_ERROR_CODES.not_found);
  }
}
