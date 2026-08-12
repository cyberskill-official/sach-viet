import assert from "node:assert/strict";
import test from "node:test";
import { handleCheckout } from "../src/lib/commerce-http.mjs";
import { commerceMutationsEnabled } from "../src/lib/commerce-kill-switch.mjs";

test("commerce kill-switch allows mutations when unset and freezes on 0", async () => {
  assert.equal(commerceMutationsEnabled({}), true);
  assert.equal(commerceMutationsEnabled({ COMMERCE_MUTATIONS_ENABLED: "0" }), false);
  assert.equal(commerceMutationsEnabled({ COMMERCE_MUTATIONS_ENABLED: "1" }), true);
});

test("checkout HTTP handler refuses unauthenticated and frozen mutations", async () => {
  const frozen = await handleCheckout(
    new Request("http://sachviet.test/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [] }),
    }),
    { COMMERCE_MUTATIONS_ENABLED: "0" },
  );
  assert.equal(frozen.status, 503);

  const unauth = await handleCheckout(
    new Request("http://sachviet.test/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json", cookie: "sv_session=not-a-token" },
      body: JSON.stringify({ items: [{ vendorOfferId: "x", quantity: 1 }] }),
    }),
    {
      COMMERCE_MUTATIONS_ENABLED: "1",
      AUTH_SESSION_SECRET: "a-session-secret-that-is-long-enough-for-the-test-suite",
      STRIPE_SECRET_KEY: "sk_test_example",
      STRIPE_SUCCESS_URL: "https://example.test/ok",
      STRIPE_CANCEL_URL: "https://example.test/cancel",
    },
  );
  assert.equal(unauth.status, 401);

  const missingProvider = await handleCheckout(
    new Request("http://sachviet.test/api/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [{ vendorOfferId: "x", quantity: 1 }] }),
    }),
    { COMMERCE_MUTATIONS_ENABLED: "1", AUTH_SESSION_SECRET: "a-session-secret-that-is-long-enough-for-the-test-suite" },
  );
  assert.equal(missingProvider.status, 401);
});
