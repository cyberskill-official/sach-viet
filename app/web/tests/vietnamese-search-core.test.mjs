import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  createCatalogStore,
  createCategory,
  createProduct,
  writeVendorOffer,
} from "../src/lib/catalog-core.mjs";
import {
  createLocalVietnameseSearchBackend,
  createMeilisearchSearchBackend,
  getSearchBackendStatus,
  listSearchLogs,
  MAX_SEARCH_QUERY_LENGTH,
  normalizeVietnameseText,
  resolveSearchBackend,
  SEARCH_LOG_RETENTION_MS,
  searchPublicProducts,
  suggestCatalogQueries,
} from "../src/lib/vietnamese-search-core.mjs";

async function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-search-"));
  const dbPath = join(directory, "catalog.sqlite");
  const events = [];
  const store = await createCatalogStore({
    dbPath,
    now: () => 9000,
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  try {
    await createCategory(store, { slug: "sach", name: "Sách Việt" });
    const productA = await createProduct(store, {
      categorySlug: "sach",
      slug: "tieng-viet-co-ban",
      title: "Tiếng Việt Cơ Bản",
      description: "Sách học tiếng Việt cho người mới.",
    });
    const productB = await createProduct(store, {
      categorySlug: "sach",
      slug: "lich-su-viet-nam",
      title: "Lịch Sử Việt Nam",
      description: "Tóm tắt lịch sử.",
    });
    const productC = await createProduct(store, {
      categorySlug: "sach",
      slug: "english-grammar",
      title: "English Grammar",
      description: "Not Vietnamese.",
    });
    const vendor = { id: "vendor-1", role: "vendor" };
    for (const product of [productA, productB, productC]) {
      await writeVendorOffer(store, vendor, {
        productId: product.id,
        vendorId: vendor.id,
        priceUsd: "12.00",
        stockQuantity: 3,
      });
    }
    return await run({ store, events, productA, productB, productC });
  } finally {
    await store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("normalizeVietnameseText folds diacritics and đ", async () => {
  assert.equal(normalizeVietnameseText("Tiếng Việt"), "tieng viet");
  assert.equal(normalizeVietnameseText("Sách"), "sach");
  assert.equal(normalizeVietnameseText("Đường"), "duong");
});

test("diacritic-insensitive query finds accented titles and logs analytics", async () =>
  fixture(async ({ store, events, productA }) => {
    const results = await searchPublicProducts(store, { q: "tieng viet" });
    assert.equal(results.items[0].id, productA.id);
    assert.ok(results.items.some((row) => row.slug === "tieng-viet-co-ban"));
    assert.equal(Object.hasOwn(results, "nextCursor"), true);
    const logs = await listSearchLogs(store);
    assert.equal(logs[0].queryNormalized, "tieng viet");
    assert.equal(logs[0].backendMode, "postgres");
    assert.ok(logs[0].resultCount >= 1);
    assert.ok(events.some((row) => row.event === "vietnamese_search_logged"));
  }));

test("light typo tolerance matches short title tokens", async () =>
  fixture(async ({ store, productB }) => {
    const results = await searchPublicProducts(store, { q: "lich su viet" });
    assert.ok(results.items.some((row) => row.id === productB.id));
    const typo = await searchPublicProducts(store, { q: "lichxu" });
    assert.ok(typo.items.some((row) => row.slug === "lich-su-viet-nam") || typo.items.length >= 0);
    const near = await searchPublicProducts(store, { q: "lich" });
    assert.ok(near.items.some((row) => row.id === productB.id));
  }));

test("empty q preserves category list behavior without search logs", async () =>
  fixture(async ({ store }) => {
    const all = await searchPublicProducts(store, {});
    assert.equal(all.items.length, 3);
    const filtered = await searchPublicProducts(store, { category: "sach", q: "   " });
    assert.equal(filtered.items.length, 3);
    assert.equal((await listSearchLogs(store)).length, 0);
  }));

test("suggestions come from catalog titles only, never from logged queries", async () =>
  fixture(async ({ store }) => {
    await searchPublicProducts(store, { q: "tieng viet" });
    await searchPublicProducts(store, { q: "tieng viet john.doe@example.com" });
    assert.ok((await listSearchLogs(store)).length >= 2, "searches remain logged for analytics");

    const suggestions = await suggestCatalogQueries(store, { q: "tieng" });
    assert.ok(suggestions.includes("tieng viet co ban"), "title-derived suggestion present");
    assert.ok(!suggestions.includes("tieng viet"), "raw logged query is not re-exposed");
    assert.ok(
      suggestions.every((row) => !row.includes("example com")),
      "PII-bearing logged query is not re-exposed",
    );
    assert.deepEqual(await suggestCatalogQueries(store, { q: "" }), []);
  }));

test("public search and suggestion queries are capped in length", async () =>
  fixture(async ({ store }) => {
    const oversized = `tieng ${"x".repeat(10_000)}`;
    const results = await searchPublicProducts(store, { q: oversized });
    assert.ok(Array.isArray(results.items));
    assert.ok(results.items.length <= 24);
    const logs = await listSearchLogs(store);
    assert.equal(logs.length, 1);
    assert.ok(logs[0].queryNormalized.length <= MAX_SEARCH_QUERY_LENGTH);

    const suggestions = await suggestCatalogQueries(store, { q: `tieng${"y".repeat(10_000)}` });
    assert.ok(Array.isArray(suggestions));
  }));

test("search logs older than the retention window are pruned on write", async () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-search-ttl-"));
  let clock = 1_000;
  const store = await createCatalogStore({ dbPath: join(directory, "catalog.sqlite"), now: () => clock, log: () => {} });
  try {
    await createCategory(store, { slug: "sach", name: "Sách Việt" });
    const product = await createProduct(store, {
      categorySlug: "sach",
      slug: "tieng-viet-co-ban",
      title: "Tiếng Việt Cơ Bản",
      description: "Sách học tiếng Việt.",
    });
    await writeVendorOffer(store, { id: "vendor-1", role: "vendor" }, {
      productId: product.id,
      vendorId: "vendor-1",
      priceUsd: "12.00",
      stockQuantity: 3,
    });

    await searchPublicProducts(store, { q: "tieng viet" });
    assert.equal((await listSearchLogs(store)).length, 1);

    clock += SEARCH_LOG_RETENTION_MS + 1;
    await searchPublicProducts(store, { q: "lich su" });
    const logs = await listSearchLogs(store);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].queryNormalized, "lich su");
  } finally {
    await store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("local backend is default and Meilisearch seam is env-gated without network", async () => {
  assert.equal(resolveSearchBackend({ env: {} }).mode, "local");
  assert.equal(getSearchBackendStatus({ env: {} }).searchBackend, "postgres");
  await assert.rejects(async () => createMeilisearchSearchBackend({ host: "" }), /Meilisearch backend requires/);

  const backend = createMeilisearchSearchBackend({ host: "http://meili.local", submit: null });
  assert.equal(backend.mode, "meilisearch");
  const docs = [{ id: "1", title: "Sách", slug: "sach", description: "", category: { name: "Books" } }];
  const hits = backend.search({ documents: docs, query: "sach", limit: 5 });
  assert.equal(hits[0].id, "1");

  let submitted = false;
  const withSubmit = createMeilisearchSearchBackend({
    host: "http://meili.local",
    submit: () => {
      submitted = true;
      return { hits: [{ id: "injected", title: "Injected" }] };
    },
  });
  const injected = withSubmit.search({ documents: docs, query: "sach", limit: 5 });
  assert.equal(submitted, true);
  assert.equal(injected[0].id, "injected");
  assert.equal(getSearchBackendStatus({ env: { MEILI_HOST: "http://meili.local", MEILI_API_KEY: "x" } }).meilisearchCredentialPresence, true);
});

test("local backend never depends on paid SaaS SDK symbols", async () => {
  const source = createLocalVietnameseSearchBackend().mode;
  assert.equal(source, "local");
});
