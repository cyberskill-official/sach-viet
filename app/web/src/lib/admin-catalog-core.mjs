import { normalizeRole } from "./access.mjs";
import {
  addProductMedia,
  createCatalogStore,
  createCategory,
  createProduct,
  createProductVariant,
  listCategories,
  listPublicProducts,
  writeVendorOffer,
} from "./catalog-core.mjs";

function adminOnly(user) {
  if (!user?.id || normalizeRole(user.role) !== "admin") throw new Error("Administrator access is required.");
}

function defaultLog(event, fields = {}) {
  console.info(JSON.stringify({ event, task_id: "TASK-ADMIN-002", ...fields }));
}

export function createAdminCatalogStore(options = {}) {
  return createCatalogStore({ ...options, log: options.log ?? defaultLog });
}

export function listAdminCategories(store, actor) {
  adminOnly(actor);
  return listCategories(store);
}

export function createAdminCategory(store, actor, input) {
  adminOnly(actor);
  const category = createCategory(store, input ?? {});
  store.log("admin_catalog_category_created", { result: "accepted", actor_role: actor.role, category_id: category.id });
  return category;
}

export function listAdminProducts(store, actor, { category } = {}) {
  adminOnly(actor);
  return listPublicProducts(store, { category });
}

export function createAdminProduct(store, actor, input = {}) {
  adminOnly(actor);
  const product = createProduct(store, input);
  const media = Array.isArray(input.media) ? input.media.map((item) => addProductMedia(store, { ...item, productId: product.id })) : [];
  const variants = Array.isArray(input.variants)
    ? input.variants.map((item) => createProductVariant(store, { ...item, productId: product.id }))
    : input.variant
      ? [createProductVariant(store, { ...input.variant, productId: product.id })]
      : [];
  store.log("admin_catalog_product_created", {
    result: "accepted",
    actor_role: actor.role,
    product_id: product.id,
    media_count: media.length,
    variant_count: variants.length,
  });
  return { product, media, variants };
}

export function writeAdminVendorOffer(store, actor, input = {}) {
  adminOnly(actor);
  const vendorId = typeof input.vendorId === "string" && input.vendorId.trim() !== "" ? input.vendorId.trim() : actor.id;
  const offer = writeVendorOffer(store, actor, { ...input, vendorId });
  store.log("admin_catalog_offer_written", { result: "accepted", actor_role: actor.role, offer_id: offer.id, vendor_id: offer.vendorId });
  return offer;
}
