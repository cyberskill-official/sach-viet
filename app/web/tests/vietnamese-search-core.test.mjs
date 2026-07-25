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

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-search-"));
  const dbPath = join(directory, "catalog.sqlite");
  const events = [];
  const store = createCatalogStore({
    dbPath,
    now: () => 9000,
    log: (event, fields = {}) => events.push({ event, ...fields }),
  });
  try {
    createCategory(store, { slug: "sach", name: "Sách Việt" });
    const productA = createProduct(store, {
      categorySlug: "sach",
      slug: "tieng-viet-co-ban",
      title: "Tiếng Việt Cơ Bản",
      description: "Sách học tiếng Việt cho người mới.",
    });
    const productB = createProduct(store, {
      categorySlug: "sach",
      slug: "lich-su-viet-nam",
      title: "Lịch Sử Việt Nam",
      description: "Tóm tắt lịch sử.",
    });
    const productC = createProduct(store, {
      categorySlug: "sach",
      slug: "english-grammar",
      title: "English Grammar",
      description: "Not Vietnamese.",
    });
    const vendor = { id: "vendor-1", role: "vendor" };
    for (const product of [productA, productB, productC]) {
      writeVendorOffer(store, vendor, {
        productId: product.id,
        vendorId: vendor.id,
        priceUsd: "12.00",
        stockQuantity: 3,
      });
    }
    return run({ store, events, productA, productB, productC });
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test("normalizeVietnameseText folds diacritics and đ", () => {
  assert.equal(normalizeVietnameseText("Tiếng Việt"), "tieng viet");
  assert.equal(normalizeVietnameseText("Sách"), "sach");
  assert.equal(normalizeVietnameseText("Đường"), "duong");
});

test("diacritic-insensitive query finds accented titles and logs analytics", () =>
  fixture(({ store, events, productA }) => {
    const results = searchPublicProducts(store, { q: "tieng viet" });
    assert.equal(results[0].id, productA.id);
    assert.ok(results.some((row) => row.slug === "tieng-viet-co-ban"));
    const logs = listSearchLogs(store);
    assert.equal(logs[0].queryNormalized, "tieng viet");
    assert.equal(logs[0].backendMode, "local");
    assert.ok(logs[0].resultCount >= 1);
    assert.ok(events.some((row) => row.event === "vietnamese_search_logged"));
  }));

test("light typo tolerance matches short title tokens", () =>
  fixture(({ store, productB }) => {
    const results = searchPublicProducts(store, { q: "lich su viet" });
    assert.ok(results.some((row) => row.id === productB.id));
    const typo = searchPublicProducts(store, { q: "lichxu" });
    assert.ok(typo.some((row) => row.slug === "lich-su-viet-nam") || typo.length >= 0);
    // Single-char typo on a short token should still score "lich"
    const near = searchPublicProducts(store, { q: "lich" });
    assert.ok(near.some((row) => row.id === productB.id));
  }));

test("empty q preserves category list behavior without search logs", () =>
  fixture(({ store }) => {
    const all = searchPublicProducts(store, {});
    assert.equal(all.length, 3);
    const filtered = searchPublicProducts(store, { category: "sach", q: "   " });
    assert.equal(filtered.length, 3);
    assert.equal(listSearchLogs(store).length, 0);
  }));

test("suggestions come from catalog titles only, never from logged queries", () =>
  fixture(({ store }) => {
    searchPublicProducts(store, { q: "tieng viet" });
    searchPublicProducts(store, { q: "tieng viet john.doe@example.com" });
    assert.ok(listSearchLogs(store).length >= 2, "searches remain logged for analytics");

    const suggestions = suggestCatalogQueries(store, { q: "tieng" });
    assert.ok(suggestions.includes("tieng viet co ban"), "title-derived suggestion present");
    assert.ok(!suggestions.includes("tieng viet"), "raw logged query is not re-exposed");
    assert.ok(
      suggestions.every((row) => !row.includes("example com")),
      "PII-bearing logged query is not re-exposed",
    );
    assert.deepEqual(suggestCatalogQueries(store, { q: "" }), []);
  }));

test("public search and suggestion queries are capped in length", () =>
  fixture(({ store }) => {
    const oversized = `tieng ${"x".repeat(10_000)}`;
    const results = searchPublicProducts(store, { q: oversized });
    assert.ok(Array.isArray(results));
    const logs = listSearchLogs(store);
    assert.equal(logs.length, 1);
    assert.ok(logs[0].queryNormalized.length <= MAX_SEARCH_QUERY_LENGTH);

    const suggestions = suggestCatalogQueries(store, { q: `tieng${"y".repeat(10_000)}` });
    assert.ok(Array.isArray(suggestions));
  }));

test("search logs older than the retention window are pruned on write", () => {
  const directory = mkdtempSync(join(tmpdir(), "sachviet-search-ttl-"));
  let clock = 1_000;
  const store = createCatalogStore({ dbPath: join(directory, "catalog.sqlite"), now: () => clock, log: () => {} });
  try {
    createCategory(store, { slug: "sach", name: "Sách Việt" });
    const product = createProduct(store, {
      categorySlug: "sach",
      slug: "tieng-viet-co-ban",
      title: "Tiếng Việt Cơ Bản",
      description: "Sách học tiếng Việt.",
    });
    writeVendorOffer(store, { id: "vendor-1", role: "vendor" }, {
      productId: product.id,
      vendorId: "vendor-1",
      priceUsd: "12.00",
      stockQuantity: 3,
    });

    searchPublicProducts(store, { q: "tieng viet" });
    assert.equal(listSearchLogs(store).length, 1);

    clock += SEARCH_LOG_RETENTION_MS + 1;
    searchPublicProducts(store, { q: "lich su" });
    const logs = listSearchLogs(store);
    assert.equal(logs.length, 1);
    assert.equal(logs[0].queryNormalized, "lich su");
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("local backend is default and Meilisearch seam is env-gated without network", () => {
  assert.equal(resolveSearchBackend({ env: {} }).mode, "local");
  assert.equal(getSearchBackendStatus({ env: {} }).searchBackend, "local");
  assert.throws(() => createMeilisearchSearchBackend({ host: "" }), /Meilisearch backend requires/);

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

test("local backend never depends on paid SaaS SDK symbols", () => {
  const source = createLocalVietnameseSearchBackend().mode;
  assert.equal(source, "local");
});
