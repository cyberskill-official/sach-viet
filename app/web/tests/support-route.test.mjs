import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("support routes use signed sessions and server-side domain operations", () => {
  const tickets = readFileSync(resolve(root, "src/app/api/support/tickets/route.ts"), "utf8");
  const messages = readFileSync(resolve(root, "src/app/api/support/tickets/[id]/messages/route.ts"), "utf8");
  const requests = readFileSync(resolve(root, "src/app/api/support/goods-requests/route.ts"), "utf8");
  const reviews = readFileSync(resolve(root, "src/app/api/support/reviews/route.ts"), "utf8");
  for (const source of [tickets, messages, requests, reviews]) assert.match(source, /readSession/);
  assert.match(messages, /listTicketMessages/);
  assert.match(messages, /addTicketMessage/);
  assert.match(requests, /createGoodsRequest/);
  assert.match(reviews, /createReview/);
});
