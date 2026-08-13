import { createCatalogStore, getPublicProduct } from "./catalog-core.mjs";
import {
  API_ERROR_CODES,
  createRequestId,
  jsonError,
  jsonOk,
  jsonPage,
} from "./api-contract.mjs";
import { searchPublicProducts, suggestCatalogQueries } from "./vietnamese-search-core.mjs";

function parseLimit(value, fallback = 24) {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isInteger(n) ? n : fallback;
}

export async function handleListPublicProducts(request) {
  const requestId = createRequestId(request);
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const after = url.searchParams.get("after") ?? url.searchParams.get("cursor") ?? undefined;
  const limit = parseLimit(url.searchParams.get("limit"));
  const store = await createCatalogStore();
  try {
    const page = await searchPublicProducts(store, { q, category, limit, after });
    return jsonPage(page.items, page.nextCursor, {
      extra: page.timedOut ? { timedOut: true } : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog is unavailable.";
    return jsonError(API_ERROR_CODES.internal, message, { status: 500, requestId });
  } finally {
    await store.close();
  }
}

export async function handleGetPublicProduct(request, slug) {
  const requestId = createRequestId(request);
  const store = await createCatalogStore();
  try {
    const product = await getPublicProduct(store, slug);
    if (!product) {
      return jsonError(API_ERROR_CODES.not_found, "Product does not exist.", { status: 404, requestId });
    }
    return jsonOk({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Product is unavailable.";
    return jsonError(API_ERROR_CODES.internal, message, { status: 500, requestId });
  } finally {
    await store.close();
  }
}

export async function handleSuggestCatalogQueries(request) {
  const requestId = createRequestId(request);
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = parseLimit(url.searchParams.get("limit"), 8);
  const store = await createCatalogStore();
  try {
    const items = await suggestCatalogQueries(store, { q, limit });
    return jsonPage(items, null);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Suggestions are unavailable.";
    return jsonError(API_ERROR_CODES.internal, message, { status: 500, requestId });
  } finally {
    await store.close();
  }
}
