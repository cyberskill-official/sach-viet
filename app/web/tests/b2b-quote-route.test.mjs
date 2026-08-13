import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("B2B quote routes use signed sessions and server-side domain operations", async () => {
  const organizations = readFileSync(resolve(root, "src/app/api/b2b/organizations/route.ts"), "utf8");
  const pipeline = readFileSync(resolve(root, "src/app/api/b2b/quotes/pipeline/route.ts"), "utf8");
  const staffQuote = readFileSync(resolve(root, "src/app/api/b2b/quotes/[id]/route.ts"), "utf8");
  const lists = readFileSync(resolve(root, "src/app/api/institution/selection-lists/route.ts"), "utf8");
  const quotes = readFileSync(resolve(root, "src/app/api/institution/quotes/route.ts"), "utf8");
  const quoteDetail = readFileSync(resolve(root, "src/app/api/institution/quotes/[id]/route.ts"), "utf8");
  for (const source of [organizations, pipeline, staffQuote, lists, quotes, quoteDetail]) assert.match(source, /readSession/);
  assert.match(pipeline, /listQuotesPipeline/);
  assert.match(staffQuote, /getStaffQuote/);
  assert.match(staffQuote, /transitionQuoteStatus/);
  assert.match(lists, /createSelectionList/);
  assert.match(quotes, /requestQuoteFromSelectionList/);
  assert.match(quoteDetail, /getInstitutionQuote/);
});
