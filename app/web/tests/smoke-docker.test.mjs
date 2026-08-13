import assert from "node:assert/strict";
import test from "node:test";
import { evaluateReady } from "../scripts/smoke-docker.mjs";

test("evaluateReady requires HTTP 200 with ok and db", () => {
  assert.equal(evaluateReady(200, { ok: true, db: "ok" }), true);
  assert.equal(evaluateReady(503, { ok: false, db: "ok" }), false);
  assert.equal(evaluateReady(200, { ok: false, db: "ok" }), false);
  assert.equal(evaluateReady(200, { ok: true, db: "error" }), false);
  assert.equal(evaluateReady(200, null), false);
});
