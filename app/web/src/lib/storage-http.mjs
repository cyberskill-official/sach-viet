import { requireApiPermission } from "./authz-http.mjs";
import { createStorageStore, putStoredObject } from "./storage-core.mjs";
import {
  API_ERROR_CODES,
  createRequestId,
  errorStatusForMessage,
  jsonError,
  jsonOk,
  readJsonBody,
} from "./api-contract.mjs";

export async function handlePutStoredObject(request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requireApiPermission(request);
    if (!auth.ok) return auth.response;
    const body = await readJsonBody(request);
    if (!body || typeof body.bytesBase64 !== "string") {
      return jsonError(API_ERROR_CODES.invalid_request, "Stored object bytes are required.", { status: 400, requestId });
    }
    let bytes;
    try {
      bytes = Buffer.from(body.bytesBase64, "base64");
    } catch {
      return jsonError(API_ERROR_CODES.invalid_request, "Stored object encoding is invalid.", { status: 400, requestId });
    }
    const store = await createStorageStore();
    try {
      const object = await putStoredObject(store, {
        bytes,
        contentType: typeof body.contentType === "string" ? body.contentType : "application/octet-stream",
        ownerId: auth.user.id,
        key: typeof body.key === "string" ? body.key : null,
      });
      return jsonOk({ object }, { status: 201 });
    } finally {
      await store.close();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage write failed.";
    if (/not configured|AUTH_SESSION_SECRET/i.test(message)) {
      return jsonError(API_ERROR_CODES.not_configured, "Authentication is not configured.", { status: 503, requestId });
    }
    return jsonError(API_ERROR_CODES.invalid_request, message, { status: errorStatusForMessage(message), requestId });
  }
}
