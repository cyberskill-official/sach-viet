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

export async function createAdminCatalogStore(options = {}) {
  return await createCatalogStore({ ...options, log: options.log ?? defaultLog });
}

export async function listAdminCategories(store, actor) {
  adminOnly(actor);
  return await listCategories(store);
}

export async function createAdminCategory(store, actor, input) {
  adminOnly(actor);
  const category = await createCategory(store, input ?? {});
  store.log("admin_catalog_category_created", { result: "accepted", actor_role: actor.role, category_id: category.id });
  return category;
}

export async function listAdminProducts(store, actor, { category } = {}) {
  adminOnly(actor);
  return await listPublicProducts(store, { category });
}

export async function createAdminProduct(store, actor, input = {}) {
  adminOnly(actor);
  const product = await createProduct(store, input);
  const media = [];
  if (Array.isArray(input.media)) {
    for (const item of input.media) media.push(await addProductMedia(store, { ...item, productId: product.id }));
  }
  const variants = [];
  if (Array.isArray(input.variants)) {
    for (const item of input.variants) variants.push(await createProductVariant(store, { ...item, productId: product.id }));
  } else if (input.variant) {
    variants.push(await createProductVariant(store, { ...input.variant, productId: product.id }));
  }
  store.log("admin_catalog_product_created", {
    result: "accepted",
    actor_role: actor.role,
    product_id: product.id,
    media_count: media.length,
    variant_count: variants.length,
  });
  return { product, media, variants };
}

export async function writeAdminVendorOffer(store, actor, input = {}) {
  adminOnly(actor);
  const vendorId = typeof input.vendorId === "string" && input.vendorId.trim() !== "" ? input.vendorId.trim() : actor.id;
  const offer = await writeVendorOffer(store, actor, { ...input, vendorId });
  store.log("admin_catalog_offer_written", { result: "accepted", actor_role: actor.role, offer_id: offer.id, vendor_id: offer.vendorId });
  return offer;
}
