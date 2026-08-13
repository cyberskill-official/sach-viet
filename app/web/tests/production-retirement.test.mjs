import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNotProductionRetired,
  isProductionRuntime,
  isRetiredSupplierPath,
  productionRetiredMessage,
} from "../src/lib/production-retirement.mjs";
import { assertAiChatEnabled } from "../src/lib/ai-settings-core.mjs";

test("production runtime is NODE_ENV=production only", () => {
  assert.equal(isProductionRuntime({ NODE_ENV: "production" }), true);
  assert.equal(isProductionRuntime({ NODE_ENV: "test" }), false);
  assert.equal(isProductionRuntime({ NODE_ENV: "development" }), false);
  assert.equal(isProductionRuntime({}), false);
});

test("assertNotProductionRetired 410s Production and allows local/test", () => {
  assert.throws(
    () => assertNotProductionRetired("WordPress import apply", { NODE_ENV: "production" }),
    /WordPress import apply is retired on Production/,
  );
  assert.doesNotThrow(() => assertNotProductionRetired("WordPress import apply", { NODE_ENV: "test" }));
  assert.doesNotThrow(() => assertNotProductionRetired("WordPress import apply", { NODE_ENV: "development" }));
  assert.equal(
    productionRetiredMessage("Admin AI"),
    "Admin AI is retired on Production.",
  );
});

test("assertAiChatEnabled no longer honors AI_CHAT_ENABLED on Production", () => {
  assert.throws(() => assertAiChatEnabled({ NODE_ENV: "production" }), /Admin AI is retired on Production/);
  assert.throws(
    () => assertAiChatEnabled({ NODE_ENV: "production", AI_CHAT_ENABLED: "1" }),
    /Admin AI is retired on Production/,
  );
  assert.doesNotThrow(() => assertAiChatEnabled({ NODE_ENV: "test", AI_CHAT_ENABLED: "1" }));
  assert.doesNotThrow(() => assertAiChatEnabled({ NODE_ENV: "development" }));
});

test("supplier matcher paths are retired; other portals are not", () => {
  assert.equal(isRetiredSupplierPath("/supplier"), true);
  assert.equal(isRetiredSupplierPath("/supplier/"), true);
  assert.equal(isRetiredSupplierPath("/supplier/overview"), true);
  assert.equal(isRetiredSupplierPath("/admin"), false);
  assert.equal(isRetiredSupplierPath("/api/admin/ai-settings"), false);
  assert.equal(isRetiredSupplierPath("/suppliers"), false);
  assert.equal(isRetiredSupplierPath(""), false);
});
