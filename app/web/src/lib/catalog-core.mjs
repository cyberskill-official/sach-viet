import { randomBytes } from "node:crypto";
import { openDatabase } from "./db.mjs";
import { canWriteVendorOffer } from "./access.mjs";

function defaultNow() {
  return Date.now();
}

function defaultLog(event, fields = {}) {
  console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-004", ...fields }));
}

function identifier() {
  return randomBytes(16).toString("hex");
}

function requiredString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${field} is required.`);
  return value.trim();
}

function optionalString(value, field) {
  if (value === undefined || value === null || value === "") return null;
  return requiredString(value, field);
}

export function normalizeMoney(value) {
  const normalized = typeof value === "number" ? String(value) : value;
  if (typeof normalized !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,4})?$/.test(normalized)) {
    throw new Error("Money must be a non-negative decimal USD value with up to four decimal places.");
  }
  const [whole, fraction = ""] = normalized.split(".");
  return `${whole}.${fraction.padEnd(4, "0")}`;
}

function compareMoney(left, right) {
  const [leftWhole, leftFraction] = left.split(".");
  const [rightWhole, rightFraction] = right.split(".");
  const wholeDifference = BigInt(leftWhole) - BigInt(rightWhole);
  if (wholeDifference !== 0n) return wholeDifference < 0n ? -1 : 1;
  return leftFraction.localeCompare(rightFraction);
}

function requireCatalogProductInput(input) {
  const forbidden = ["price", "listPrice", "stock", "priceUsd", "listPriceUsd", "stockQuantity"].filter((field) => Object.hasOwn(input, field));
  if (forbidden.length) throw new Error(`Product fields cannot contain offer data: ${forbidden.join(", ")}.`);
}

export async function createCatalogStore({ dbPath, now = defaultNow, log = defaultLog } = {}) {
  const db = await openDatabase(dbPath);
  return { db, now, log, close: () => db.close() };
}

export async function createCategory(store, input) {
  const category = { id: identifier(), slug: requiredString(input.slug, "Category slug"), name: requiredString(input.name, "Category name") };
  await store.db.prepare("INSERT INTO categories (id, slug, name, created_at) VALUES (?, ?, ?, ?)").run(category.id, category.slug, category.name, store.now());
  return category;
}

export async function listCategories(store) {
  return await store.db.prepare("SELECT id, slug, name, created_at AS createdAt FROM categories ORDER BY name, id").all();
}

export async function createProduct(store, input) {
  requireCatalogProductInput(input);
  const category = await store.db.prepare("SELECT id FROM categories WHERE id = ? OR slug = ?").get(input.categoryId ?? "", input.categorySlug ?? "");
  if (!category) throw new Error("A valid category is required.");
  const product = {
    id: identifier(),
    slug: requiredString(input.slug, "Product slug"),
    title: requiredString(input.title, "Product title"),
    description: optionalString(input.description, "Product description"),
    categoryId: category.id,
  };
  await store.db.prepare("INSERT INTO products (id, category_id, slug, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(product.id, product.categoryId, product.slug, product.title, product.description, store.now(), store.now());
  return product;
}

export async function addProductMedia(store, input) {
  const media = { id: identifier(), productId: requiredString(input.productId, "Product ID"), url: requiredString(input.url, "Media URL"), altText: optionalString(input.altText, "Media alt text"), sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : 0 };
  await store.db.prepare("INSERT INTO product_media (id, product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)").run(media.id, media.productId, media.url, media.altText, media.sortOrder);
  return media;
}

export async function createProductVariant(store, input) {
  const attributes = input.attributes && typeof input.attributes === "object" && !Array.isArray(input.attributes) ? input.attributes : {};
  const variant = { id: identifier(), productId: requiredString(input.productId, "Product ID"), sku: requiredString(input.sku, "Variant SKU"), title: requiredString(input.title, "Variant title"), attributes };
  await store.db.prepare("INSERT INTO product_variants (id, product_id, sku, title, attributes_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(variant.id, variant.productId, variant.sku, variant.title, JSON.stringify(attributes), store.now());
  return variant;
}

export async function writeVendorOffer(store, actor, input) {
  const vendorId = requiredString(input.vendorId, "Vendor ID");
  if (!canWriteVendorOffer(actor, vendorId)) {
    store.log("catalog_offer_write_rejected", { result: "rejected", actor_role: actor?.role ?? "anonymous", reason: "role" });
    throw new Error("You cannot write this vendor offer.");
  }
  const productId = requiredString(input.productId, "Product ID");
  if (!await store.db.prepare("SELECT id FROM products WHERE id = ?").get(productId)) throw new Error("Product does not exist.");
  const variantId = optionalString(input.variantId, "Variant ID");
  if (variantId && !await store.db.prepare("SELECT id FROM product_variants WHERE id = ? AND product_id = ?").get(variantId, productId)) throw new Error("Variant does not belong to product.");
  const offer = {
    id: input.id ? requiredString(input.id, "Offer ID") : identifier(),
    productId,
    variantId,
    vendorId,
    priceUsd: normalizeMoney(input.priceUsd),
    listPriceUsd: input.listPriceUsd === undefined ? null : normalizeMoney(input.listPriceUsd),
    stockQuantity: Number(input.stockQuantity),
    isActive: input.isActive === false ? 0 : 1,
  };
  if (!Number.isInteger(offer.stockQuantity) || offer.stockQuantity < 0) throw new Error("Stock quantity must be a non-negative integer.");
  const existing = await store.db.prepare("SELECT id, vendor_id FROM vendor_offers WHERE id = ?").get(offer.id);
  if (existing && existing.vendor_id !== vendorId && !canWriteVendorOffer(actor, existing.vendor_id)) throw new Error("You cannot change this vendor offer.");
  if (existing) {
    await store.db.prepare("UPDATE vendor_offers SET product_id = ?, variant_id = ?, vendor_id = ?, price_usd = ?, list_price_usd = ?, stock_quantity = ?, is_active = ?, updated_at = ? WHERE id = ?")
      .run(offer.productId, offer.variantId, offer.vendorId, offer.priceUsd, offer.listPriceUsd, offer.stockQuantity, offer.isActive, store.now(), offer.id);
  } else {
    await store.db.prepare("INSERT INTO vendor_offers (id, product_id, variant_id, vendor_id, price_usd, list_price_usd, stock_quantity, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(offer.id, offer.productId, offer.variantId, offer.vendorId, offer.priceUsd, offer.listPriceUsd, offer.stockQuantity, offer.isActive, store.now(), store.now());
  }
  store.log("catalog_offer_write_completed", { result: "accepted", actor_role: actor.role, offer_id: offer.id, product_id: offer.productId });
  return offer;
}

export async function selectPrimaryOffer(store, productId) {
  const offers = await store.db.prepare("SELECT id, vendor_id, price_usd, list_price_usd, stock_quantity FROM vendor_offers WHERE product_id = ? AND is_active = 1 AND stock_quantity > 0").all(productId);
  offers.sort((left, right) => compareMoney(left.price_usd, right.price_usd) || left.vendor_id.localeCompare(right.vendor_id) || left.id.localeCompare(right.id));
  const winner = offers[0];
  return winner ? { id: winner.id, priceUsd: winner.price_usd, listPriceUsd: winner.list_price_usd, stockQuantity: winner.stock_quantity } : null;
}

export async function hydrateProducts(store, products) {
  if (!products.length) return [];
  const ids = products.map((product) => product.id);
  const placeholders = ids.map(() => "?").join(",");
  const mediaRows = await store.db
    .prepare(
      `SELECT product_id AS productId, url, alt_text AS altText, sort_order AS sortOrder
       FROM product_media WHERE product_id IN (${placeholders}) ORDER BY sort_order, id`,
    )
    .all(...ids);
  const variantRows = await store.db
    .prepare(
      `SELECT product_id AS productId, id, sku, title, attributes_json
       FROM product_variants WHERE product_id IN (${placeholders}) ORDER BY sku`,
    )
    .all(...ids);
  const offerRows = await store.db
    .prepare(
      `SELECT product_id AS productId, id, vendor_id, price_usd, list_price_usd, stock_quantity
       FROM vendor_offers WHERE product_id IN (${placeholders}) AND is_active = 1 AND stock_quantity > 0`,
    )
    .all(...ids);
  const mediaByProduct = new Map();
  for (const row of mediaRows) {
    const list = mediaByProduct.get(row.productId) || [];
    list.push({ url: row.url, altText: row.altText, sortOrder: row.sortOrder });
    mediaByProduct.set(row.productId, list);
  }
  const variantsByProduct = new Map();
  for (const row of variantRows) {
    const list = variantsByProduct.get(row.productId) || [];
    list.push({ id: row.id, sku: row.sku, title: row.title, attributes: JSON.parse(row.attributes_json) });
    variantsByProduct.set(row.productId, list);
  }
  const offerByProduct = new Map();
  for (const row of offerRows) {
    const current = offerByProduct.get(row.productId);
    if (
      !current ||
      compareMoney(row.price_usd, current.priceUsd) < 0 ||
      (compareMoney(row.price_usd, current.priceUsd) === 0 &&
        (row.vendor_id.localeCompare(current.vendorId) < 0 ||
          (row.vendor_id === current.vendorId && row.id.localeCompare(current.id) < 0)))
    ) {
      offerByProduct.set(row.productId, {
        id: row.id,
        vendorId: row.vendor_id,
        priceUsd: row.price_usd,
        listPriceUsd: row.list_price_usd,
        stockQuantity: row.stock_quantity,
      });
    }
  }
  return products.map((product) => {
    const offer = offerByProduct.get(product.id);
    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      category: { slug: product.category_slug, name: product.category_name },
      media: mediaByProduct.get(product.id) || [],
      variants: variantsByProduct.get(product.id) || [],
      primaryOffer: offer
        ? { id: offer.id, priceUsd: offer.priceUsd, listPriceUsd: offer.listPriceUsd, stockQuantity: offer.stockQuantity }
        : null,
    };
  });
}

export async function getPublicProduct(store, slug) {
  const product = await store.db.prepare(`SELECT products.id, products.slug, products.title, products.description, categories.slug AS category_slug, categories.name AS category_name
    FROM products JOIN categories ON categories.id = products.category_id WHERE products.slug = ?`).get(slug);
  if (!product) return null;
  const [hydrated] = await hydrateProducts(store, [product]);
  return hydrated || null;
}

export async function listPublicProducts(store, { category, limit, after } = {}) {
  const capped = Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : null;
  const clauses = [];
  const params = [];
  if (category) {
    clauses.push("categories.slug = ?");
    params.push(category);
  }
  if (after) {
    const cursor = await store.db.prepare("SELECT title, id FROM products WHERE id = ?").get(after);
    if (cursor) {
      clauses.push("(products.title, products.id) > (?, ?)");
      params.push(cursor.title, cursor.id);
    }
  }
  let sql = `SELECT products.id, products.slug, products.title, products.description, categories.slug AS category_slug, categories.name AS category_name
    FROM products JOIN categories ON categories.id = products.category_id`;
  if (clauses.length) sql += ` WHERE ${clauses.join(" AND ")}`;
  sql += " ORDER BY products.title, products.id";
  if (capped) {
    sql += " LIMIT ?";
    params.push(capped);
  }
  const products = await store.db.prepare(sql).all(...params);
  return hydrateProducts(store, products);
}

/**
 * @param {*} store
 * @param {*} actor
 * @param {{ vendorId?: string, after?: string, limit?: number }} [options]
 */
export async function listVendorOffers(store, actor, { vendorId, after, limit = 24 } = {}) {
  const ownerId = vendorId || actor?.id;
  if (!canWriteVendorOffer(actor, ownerId)) {
    throw new Error("You cannot read this vendor offer.");
  }
  const capped = Math.min(Math.max(Number(limit) || 24, 1), 100);
  const clauses = ["vendor_offers.vendor_id = ?"];
  const params = [ownerId];
  if (after) {
    const cursor = await store.db.prepare("SELECT id FROM vendor_offers WHERE id = ? AND vendor_id = ?").get(after, ownerId);
    if (cursor) {
      clauses.push("vendor_offers.id > ?");
      params.push(after);
    }
  }
  const rows = await store.db
    .prepare(
      `SELECT vendor_offers.id, vendor_offers.product_id AS productId, vendor_offers.variant_id AS variantId,
              vendor_offers.vendor_id AS vendorId, vendor_offers.price_usd AS priceUsd,
              vendor_offers.list_price_usd AS listPriceUsd, vendor_offers.stock_quantity AS stockQuantity,
              vendor_offers.is_active AS isActive, products.title AS productTitle, products.slug AS productSlug
       FROM vendor_offers
       JOIN products ON products.id = vendor_offers.product_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY products.title ASC, vendor_offers.id ASC
       LIMIT ?`,
    )
    .all(...params, capped + 1);
  const hasMore = rows.length > capped;
  const items = (hasMore ? rows.slice(0, capped) : rows).map((row) => ({
    ...row,
    isActive: row.isActive === 1,
  }));
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}
