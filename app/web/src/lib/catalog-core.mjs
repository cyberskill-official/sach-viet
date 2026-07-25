import { randomBytes } from "node:crypto";
import { openSqliteDatabase } from "./sqlite.mjs";
import { canAccessOwnedRecord } from "./access.mjs";

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

export function createCatalogStore({ dbPath, now = defaultNow, log = defaultLog } = {}) {
  const db = openSqliteDatabase(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      primary_offer_policy TEXT NOT NULL DEFAULT 'lowest_price' CHECK (primary_offer_policy = 'lowest_price'),
      created_at INTEGER NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS product_media (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      url TEXT NOT NULL,
      alt_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      attributes_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id)
    ) STRICT;
    CREATE TABLE IF NOT EXISTS vendor_offers (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      vendor_id TEXT NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
      price_usd TEXT NOT NULL,
      list_price_usd TEXT,
      stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
      is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (variant_id) REFERENCES product_variants(id)
    ) STRICT;
    CREATE INDEX IF NOT EXISTS vendor_offers_product_eligibility_idx ON vendor_offers(product_id, is_active, stock_quantity, vendor_id);
  `);
  return { db, now, log, close: () => db.close() };
}

export function createCategory(store, input) {
  const category = { id: identifier(), slug: requiredString(input.slug, "Category slug"), name: requiredString(input.name, "Category name") };
  store.db.prepare("INSERT INTO categories (id, slug, name, created_at) VALUES (?, ?, ?, ?)").run(category.id, category.slug, category.name, store.now());
  return category;
}

export function createProduct(store, input) {
  requireCatalogProductInput(input);
  const category = store.db.prepare("SELECT id FROM categories WHERE id = ? OR slug = ?").get(input.categoryId ?? "", input.categorySlug ?? "");
  if (!category) throw new Error("A valid category is required.");
  const product = {
    id: identifier(),
    slug: requiredString(input.slug, "Product slug"),
    title: requiredString(input.title, "Product title"),
    description: optionalString(input.description, "Product description"),
    categoryId: category.id,
  };
  store.db.prepare("INSERT INTO products (id, category_id, slug, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .run(product.id, product.categoryId, product.slug, product.title, product.description, store.now(), store.now());
  return product;
}

export function addProductMedia(store, input) {
  const media = { id: identifier(), productId: requiredString(input.productId, "Product ID"), url: requiredString(input.url, "Media URL"), altText: optionalString(input.altText, "Media alt text"), sortOrder: Number.isInteger(input.sortOrder) ? input.sortOrder : 0 };
  store.db.prepare("INSERT INTO product_media (id, product_id, url, alt_text, sort_order) VALUES (?, ?, ?, ?, ?)").run(media.id, media.productId, media.url, media.altText, media.sortOrder);
  return media;
}

export function createProductVariant(store, input) {
  const attributes = input.attributes && typeof input.attributes === "object" && !Array.isArray(input.attributes) ? input.attributes : {};
  const variant = { id: identifier(), productId: requiredString(input.productId, "Product ID"), sku: requiredString(input.sku, "Variant SKU"), title: requiredString(input.title, "Variant title"), attributes };
  store.db.prepare("INSERT INTO product_variants (id, product_id, sku, title, attributes_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(variant.id, variant.productId, variant.sku, variant.title, JSON.stringify(attributes), store.now());
  return variant;
}

export function writeVendorOffer(store, actor, input) {
  const vendorId = requiredString(input.vendorId, "Vendor ID");
  if (!canAccessOwnedRecord(actor, vendorId)) {
    store.log("catalog_offer_write_rejected", { result: "rejected", actor_role: actor?.role ?? "anonymous", reason: "ownership" });
    throw new Error("You cannot write this vendor offer.");
  }
  const productId = requiredString(input.productId, "Product ID");
  if (!store.db.prepare("SELECT id FROM products WHERE id = ?").get(productId)) throw new Error("Product does not exist.");
  const variantId = optionalString(input.variantId, "Variant ID");
  if (variantId && !store.db.prepare("SELECT id FROM product_variants WHERE id = ? AND product_id = ?").get(variantId, productId)) throw new Error("Variant does not belong to product.");
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
  const existing = store.db.prepare("SELECT id, vendor_id FROM vendor_offers WHERE id = ?").get(offer.id);
  if (existing && existing.vendor_id !== vendorId && !canAccessOwnedRecord(actor, existing.vendor_id)) throw new Error("You cannot change this vendor offer.");
  if (existing) {
    store.db.prepare("UPDATE vendor_offers SET product_id = ?, variant_id = ?, vendor_id = ?, price_usd = ?, list_price_usd = ?, stock_quantity = ?, is_active = ?, updated_at = ? WHERE id = ?")
      .run(offer.productId, offer.variantId, offer.vendorId, offer.priceUsd, offer.listPriceUsd, offer.stockQuantity, offer.isActive, store.now(), offer.id);
  } else {
    store.db.prepare("INSERT INTO vendor_offers (id, product_id, variant_id, vendor_id, price_usd, list_price_usd, stock_quantity, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(offer.id, offer.productId, offer.variantId, offer.vendorId, offer.priceUsd, offer.listPriceUsd, offer.stockQuantity, offer.isActive, store.now(), store.now());
  }
  store.log("catalog_offer_write_completed", { result: "accepted", actor_role: actor.role, offer_id: offer.id, product_id: offer.productId });
  return offer;
}

export function selectPrimaryOffer(store, productId) {
  const offers = store.db.prepare("SELECT id, vendor_id, price_usd, list_price_usd, stock_quantity FROM vendor_offers WHERE product_id = ? AND is_active = 1 AND stock_quantity > 0").all(productId);
  offers.sort((left, right) => compareMoney(left.price_usd, right.price_usd) || left.vendor_id.localeCompare(right.vendor_id) || left.id.localeCompare(right.id));
  const winner = offers[0];
  return winner ? { id: winner.id, priceUsd: winner.price_usd, listPriceUsd: winner.list_price_usd, stockQuantity: winner.stock_quantity } : null;
}

function hydrateProduct(store, product) {
  if (!product) return null;
  const media = store.db.prepare("SELECT url, alt_text AS altText, sort_order AS sortOrder FROM product_media WHERE product_id = ? ORDER BY sort_order, id").all(product.id);
  const variants = store.db.prepare("SELECT id, sku, title, attributes_json FROM product_variants WHERE product_id = ? ORDER BY sku").all(product.id)
    .map((variant) => ({ id: variant.id, sku: variant.sku, title: variant.title, attributes: JSON.parse(variant.attributes_json) }));
  return { id: product.id, slug: product.slug, title: product.title, description: product.description, category: { slug: product.category_slug, name: product.category_name }, media, variants, primaryOffer: selectPrimaryOffer(store, product.id) };
}

export function getPublicProduct(store, slug) {
  const product = store.db.prepare(`SELECT products.id, products.slug, products.title, products.description, categories.slug AS category_slug, categories.name AS category_name
    FROM products JOIN categories ON categories.id = products.category_id WHERE products.slug = ?`).get(slug);
  return hydrateProduct(store, product);
}

export function listPublicProducts(store, { category } = {}) {
  const products = category
    ? store.db.prepare(`SELECT products.id, products.slug, products.title, products.description, categories.slug AS category_slug, categories.name AS category_name
      FROM products JOIN categories ON categories.id = products.category_id WHERE categories.slug = ? ORDER BY products.title, products.id`).all(category)
    : store.db.prepare(`SELECT products.id, products.slug, products.title, products.description, categories.slug AS category_slug, categories.name AS category_name
      FROM products JOIN categories ON categories.id = products.category_id ORDER BY products.title, products.id`).all();
  return products.map((product) => hydrateProduct(store, product));
}
