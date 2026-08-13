import assert from "node:assert/strict";
import test from "node:test";
import { isSameOriginRequest } from "../src/lib/csrf.mjs";

test("same-origin allows loopback aliases and rejects other hosts", () => {
  const requestUrl = "http://localhost:3100/api/auth/register";
  assert.equal(
    isSameOriginRequest(new Request(requestUrl, { method: "POST", headers: { origin: "http://127.0.0.1:3100" } })),
    true,
  );
  assert.equal(
    isSameOriginRequest(new Request(requestUrl, { method: "POST", headers: { origin: "http://localhost:3100" } })),
    true,
  );
  assert.equal(
    isSameOriginRequest(new Request(requestUrl, { method: "POST", headers: { origin: "https://evil.example" } })),
    false,
  );
  assert.equal(isSameOriginRequest(new Request(requestUrl, { method: "POST" })), true);
});
