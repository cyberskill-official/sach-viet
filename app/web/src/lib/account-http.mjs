import { requireApiPermission } from "./authz-http.mjs";
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
} from "./api-contract.mjs";
import {
  createTourStore,
  listTourProgress,
  mergeAndPersistTourProgress,
  upsertTourProgress,
} from "./tours/tour-core.mjs";

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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createAccountStore();
    try {
      return jsonOk({ account: await getAccount(store, auth.user) });
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid account request.", { status: 400, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk({ account: await updateAccount(store, auth.user, body) });
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid password request.", { status: 400, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk(await changeAccountPassword(store, auth.user, body));
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const url = new URL(request.url);
    const store = await createAccountStore();
    try {
      const page = await listAddresses(store, auth.user, {
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid address request.", { status: 400, requestId });
    const store = await createAccountStore();
    try {
      return jsonOk({ address: await createAddress(store, auth.user, body) }, { status: 201 });
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
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createAccountStore();
    try {
      return jsonOk(await deleteAddress(store, auth.user, addressId));
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId, API_ERROR_CODES.not_found);
  }
}

export async function handleGetTours(request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const store = await createTourStore();
    try {
      return jsonOk({ tours: await listTourProgress(store, auth.user) });
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId);
  }
}

export async function handlePatchTours(request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid tour request.", { status: 400, requestId });
    const store = await createTourStore();
    try {
      if (body.merge && typeof body.merge === "object") {
        return jsonOk({ tours: await mergeAndPersistTourProgress(store, auth.user, body.merge) });
      }
      if (typeof body.tourId === "string" && body.status) {
        await upsertTourProgress(store, auth.user, body.tourId, body.status);
        return jsonOk({ tours: await listTourProgress(store, auth.user) });
      }
      return jsonError(API_ERROR_CODES.invalid_request, "Invalid tour request.", { status: 400, requestId });
    } finally {
      await store.close();
    }
  } catch (error) {
    return fail(error, requestId);
  }
}
