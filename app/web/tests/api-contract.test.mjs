import assert from "node:assert/strict";
import test from "node:test";
import {
  API_ERROR_CODES,
  createRequestId,
  errorStatusForMessage,
  jsonError,
  jsonPage,
  pageSlice,
} from "../src/lib/api-contract.mjs";

test("jsonError uses the envelope { code, message, requestId }", async () => {
  const response = jsonError(API_ERROR_CODES.invalid_request, "Bad input.", { status: 400, requestId: "req-12345678" });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    error: { code: "invalid_request", message: "Bad input.", requestId: "req-12345678" },
  });
});

test("jsonPage returns items and nextCursor", async () => {
  const response = jsonPage([{ id: "a" }], "a");
  assert.deepEqual(await response.json(), { items: [{ id: "a" }], nextCursor: "a" });
});

test("pageSlice caps and emits a cursor", () => {
  const rows = [{ id: "1" }, { id: "2" }, { id: "3" }];
  assert.deepEqual(pageSlice(rows, 2), { items: [{ id: "1" }, { id: "2" }], nextCursor: "2", limit: 2 });
  assert.equal(pageSlice(rows, 10).nextCursor, null);
});

test("createRequestId prefers a safe incoming header", () => {
  const request = new Request("https://sachviet.test/api/x", { headers: { "x-request-id": "abc-12345678" } });
  assert.equal(createRequestId(request), "abc-12345678");
  assert.match(createRequestId(new Request("https://sachviet.test/api/x")), /^[0-9a-f]{16}$/);
});

test("errorStatusForMessage maps authz and missing records", () => {
  assert.equal(errorStatusForMessage("Unauthenticated."), 401);
  assert.equal(errorStatusForMessage("Vendor access is required."), 403);
  assert.equal(errorStatusForMessage("Order does not exist."), 404);
  assert.equal(errorStatusForMessage("Quote already has an order."), 409);
});
