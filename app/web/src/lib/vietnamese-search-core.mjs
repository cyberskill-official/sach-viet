import { randomBytes } from "node:crypto";
import { listPublicProducts } from "./catalog-core.mjs";

const identifier = () => randomBytes(16).toString("hex");

/** Public search input is truncated to this many characters to bound Levenshtein/CPU cost. */
export const MAX_SEARCH_QUERY_LENGTH = 120;

/** Raw search_logs rows older than this are pruned on write (analytics retention, never public). */
export const SEARCH_LOG_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function capSearchQuery(value) {
  const query = typeof value === "string" ? value.trim() : "";
  return query.slice(0, MAX_SEARCH_QUERY_LENGTH);
}

/** Fold Vietnamese diacritics for search (đ/Đ → d; combining marks stripped). */
export function normalizeVietnameseText(value) {
  return String(value ?? "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeVietnamese(value) {
  const normalized = normalizeVietnameseText(value);
  return normalized ? normalized.split(" ") : [];
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[a.length][b.length];
}

function tokenMatchScore(queryToken, documentToken) {
  if (queryToken === documentToken) return 100;
  if (documentToken.startsWith(queryToken) || queryToken.startsWith(documentToken)) return 70;
  const maxDistance = queryToken.length <= 4 ? 1 : 2;
  const distance = levenshtein(queryToken, documentToken);
  if (distance <= maxDistance) return Math.max(20, 60 - distance * 15);
  return 0;
}

function scoreDocument(query, document) {
  const queryTokens = tokenizeVietnamese(query);
  if (!queryTokens.length) return 0;
  const fields = [
    { weight: 5, text: document.title },
    { weight: 3, text: document.slug },
    { weight: 2, text: document.category?.name },
    { weight: 1, text: document.description },
  ];
  const normalizedQuery = normalizeVietnameseText(query);
  let score = 0;
  for (const field of fields) {
    const normalizedField = normalizeVietnameseText(field.text || "");
    if (!normalizedField) continue;
    if (normalizedField === normalizedQuery) score += 500 * field.weight;
    else if (normalizedField.includes(normalizedQuery)) score += 200 * field.weight;
    const fieldTokens = tokenizeVietnamese(normalizedField);
    for (const queryToken of queryTokens) {
      let best = 0;
      for (const fieldToken of fieldTokens) {
        best = Math.max(best, tokenMatchScore(queryToken, fieldToken));
      }
      score += best * field.weight;
    }
  }
  return score;
}

/** No-op: search_logs schema is applied by the initial migration. */
export function ensureSearchSchema() {}

export function createLocalVietnameseSearchBackend({ log } = {}) {
  return {
    mode: "local",
    search({ documents, query, limit }) {
      const ranked = documents
        .map((document) => ({ document, score: scoreDocument(query, document) }))
        .filter((row) => row.score > 0)
        .sort(
          (left, right) =>
            right.score - left.score ||
            left.document.title.localeCompare(right.document.title) ||
            left.document.id.localeCompare(right.document.id),
        )
        .slice(0, limit)
        .map((row) => row.document);
      log?.("vietnamese_search_local", {
        result: "ranked",
        backend_mode: "local",
        query_normalized: normalizeVietnameseText(query),
        result_count: ranked.length,
      });
      return ranked;
    },
  };
}

export function createMeilisearchSearchBackend({
  host = process.env.MEILI_HOST,
  apiKey = process.env.MEILI_API_KEY,
  indexUid = process.env.MEILI_INDEX || "catalog_products",
  submit = null,
  log,
} = {}) {
  if (!host) throw new Error("Meilisearch backend requires MEILI_HOST.");
  const local = createLocalVietnameseSearchBackend({ log });
  return {
    mode: "meilisearch",
    search({ documents, query, limit }) {
      if (typeof submit === "function") {
        const result = submit({
          host,
          indexUid,
          query,
          limit,
          apiKeyConfigured: Boolean(apiKey),
          documents,
        });
        const hits = Array.isArray(result?.hits) ? result.hits : [];
        log?.("vietnamese_search_meilisearch", {
          result: "submitted",
          backend_mode: "meilisearch",
          query_normalized: normalizeVietnameseText(query),
          result_count: hits.length,
        });
        return hits;
      }
      // Env-gated seam without network: rank locally over provided catalog documents.
      log?.("vietnamese_search_meilisearch_local_fallback", {
        result: "recorded",
        backend_mode: "meilisearch",
        query_normalized: normalizeVietnameseText(query),
      });
      return local.search({ documents, query, limit });
    },
  };
}

export function resolveSearchBackend({ env = process.env, submit = null, log } = {}) {
  if (env.MEILI_HOST) {
    return createMeilisearchSearchBackend({
      host: env.MEILI_HOST,
      apiKey: env.MEILI_API_KEY,
      indexUid: env.MEILI_INDEX || "catalog_products",
      submit,
      log,
    });
  }
  return createLocalVietnameseSearchBackend({ log });
}

export function getSearchBackendStatus({ env = process.env } = {}) {
  return {
    searchBackend: env.MEILI_HOST ? "meilisearch" : "local",
    meilisearchConfigured: Boolean(env.MEILI_HOST),
    meilisearchCredentialPresence: Boolean(env.MEILI_API_KEY),
  };
}

function recordSearchLog(store, { queryNormalized, resultCount, backendMode }) {
  ensureSearchSchema(store);
  store.db
    .prepare("DELETE FROM search_logs WHERE created_at < ?")
    .run(store.now() - SEARCH_LOG_RETENTION_MS);
  const id = identifier();
  store.db
    .prepare(
      "INSERT INTO search_logs (id, query_normalized, result_count, backend_mode, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .run(id, queryNormalized, resultCount, backendMode, store.now());
  store.log?.("vietnamese_search_logged", {
    result: "recorded",
    backend_mode: backendMode,
    query_normalized: queryNormalized,
    result_count: resultCount,
  });
  return id;
}

export function listSearchLogs(store, { limit = 50 } = {}) {
  ensureSearchSchema(store);
  return store.db
    .prepare(
      "SELECT id, query_normalized AS queryNormalized, result_count AS resultCount, backend_mode AS backendMode, created_at AS createdAt FROM search_logs ORDER BY created_at DESC, id DESC LIMIT ?",
    )
    .all(limit);
}

/**
 * Search public catalog products. Empty/whitespace `q` returns existing list/category behavior.
 * `q` is truncated to MAX_SEARCH_QUERY_LENGTH before ranking to bound CPU cost.
 * @param {import("./catalog-core.mjs").CatalogStore | { db: unknown, now: Function, log?: Function, close?: Function }} store
 * @param {{ q?: string | null, category?: string, limit?: number, backend?: { mode: string, search: Function } }} [options]
 * @returns {unknown[]}
 */
export function searchPublicProducts(store, options = {}) {
  const { q, category, limit = 24, backend } = options;
  const products = listPublicProducts(store, { category });
  const query = capSearchQuery(q);
  if (!query) return products;

  const resolved = backend || resolveSearchBackend({ log: store.log });
  const cappedLimit = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const ranked = resolved.search({ documents: products, query, limit: cappedLimit });
  recordSearchLog(store, {
    queryNormalized: normalizeVietnameseText(query),
    resultCount: ranked.length,
    backendMode: resolved.mode,
  });
  return ranked;
}

/**
 * Public search suggestions sourced ONLY from catalog product titles.
 * Historical search_logs are analytics-only and must never be re-exposed here
 * (user-typed queries can contain PII). `q` is truncated to MAX_SEARCH_QUERY_LENGTH.
 * @param {import("./catalog-core.mjs").CatalogStore | { db: unknown, now: Function, log?: Function }} store
 * @param {{ q?: string | null, limit?: number }} [options]
 * @returns {string[]}
 */
export function suggestCatalogQueries(store, options = {}) {
  const { q, limit = 8 } = options;
  const query = capSearchQuery(q);
  if (!query) return [];
  const normalized = normalizeVietnameseText(query);
  if (!normalized) return [];
  const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

  const fromTitles = listPublicProducts(store)
    .map((product) => normalizeVietnameseText(product.title))
    .filter((title) => title.startsWith(normalized) || title.includes(` ${normalized}`));

  const suggestions = [];
  for (const suggestion of fromTitles) {
    if (!suggestions.includes(suggestion)) suggestions.push(suggestion);
    if (suggestions.length >= cappedLimit) break;
  }
  return suggestions;
}
