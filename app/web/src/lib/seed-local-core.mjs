import { createHash, randomBytes } from "node:crypto";
import { createAdminCommerceStore, submitVendorApplication } from "./admin-commerce-core.mjs";
import { bootstrapFirstAdmin, createAuthStore, hashPassword, normalizeEmail } from "./auth-core.mjs";
import {
  addProductMedia,
  createCatalogStore,
  createCategory,
  createProduct,
  createProductVariant,
  writeVendorOffer,
} from "./catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "./commerce-core.mjs";
import { createNotification, createNotificationStore } from "./notification-core.mjs";
import { createReview, createSupportStore, createTicket } from "./support-core.mjs";
import { createVendorCommerceStore, createVendorPayout } from "./vendor-commerce-core.mjs";

/** Stable ids keep re-runs idempotent for records the domain cores upsert by id. */
function seedIdentifier(kind, key) {
  return createHash("sha256").update(`sachviet-seed:${kind}:${key}`).digest("hex").slice(0, 32);
}

function moneyUnits(value) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0"));
}

function moneyString(value) {
  return `${value / 10000n}.${String(value % 10000n).padStart(4, "0")}`;
}

export function generateSeedPassword() {
  return `sv-${randomBytes(9).toString("base64url")}`;
}

export const SEED_CATEGORIES = Object.freeze([
  { slug: "van-hoc", name: "Văn học Việt Nam" },
  { slug: "thieu-nhi", name: "Thiếu nhi" },
  { slug: "ky-nang", name: "Kỹ năng sống" },
]);

export const SEED_USERS = Object.freeze([
  { key: "admin", email: "admin.seed@sachviet.test", role: "admin" },
  { key: "vendorAn", email: "nhasach-an.seed@sachviet.test", role: "vendor" },
  { key: "vendorPhuongNam", email: "phuong-nam.seed@sachviet.test", role: "vendor" },
  { key: "customer", email: "khach-hang.seed@sachviet.test", role: "customer" },
  { key: "applicant", email: "ung-vien.seed@sachviet.test", role: "customer" },
]);

export const SEED_PRODUCTS = Object.freeze([
  {
    slug: "de-men-phieu-luu-ky",
    categorySlug: "thieu-nhi",
    title: "Dế Mèn Phiêu Lưu Ký",
    description: "Hành trình trưởng thành của chú Dế Mèn qua những vùng đất mới, tình bạn và bài học về lòng khiêm nhường.",
    variants: [{ sku: "de-men-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } }],
    offers: [
      { vendor: "vendorAn", priceUsd: "4.50", listPriceUsd: "6.00", stockQuantity: 24 },
      { vendor: "vendorPhuongNam", priceUsd: "4.90", stockQuantity: 8 },
    ],
  },
  {
    slug: "so-do",
    categorySlug: "van-hoc",
    title: "Số Đỏ",
    description: "Tiểu thuyết trào phúng kinh điển của Vũ Trọng Phụng về xã hội thành thị Việt Nam đầu thế kỷ 20.",
    variants: [
      { sku: "so-do-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } },
      { sku: "so-do-bia-cung", title: "Bìa cứng", attributes: { format: "hardcover" } },
    ],
    offers: [
      { vendor: "vendorPhuongNam", priceUsd: "5.25", listPriceUsd: "7.00", stockQuantity: 15 },
      { vendor: "vendorAn", priceUsd: "5.75", stockQuantity: 6 },
    ],
  },
  {
    slug: "truyen-kieu",
    categorySlug: "van-hoc",
    title: "Truyện Kiều",
    description: "Kiệt tác thơ Nôm của Nguyễn Du, bản chú giải dành cho bạn đọc phổ thông.",
    variants: [{ sku: "truyen-kieu-chu-giai", title: "Bản chú giải", attributes: { format: "annotated" } }],
    offers: [{ vendor: "vendorAn", priceUsd: "7.00", listPriceUsd: "9.50", stockQuantity: 12 }],
  },
  {
    slug: "toi-thay-hoa-vang-tren-co-xanh",
    categorySlug: "van-hoc",
    title: "Tôi Thấy Hoa Vàng Trên Cỏ Xanh",
    description: "Câu chuyện tuổi thơ ở một vùng quê nghèo, viết bằng giọng văn trong trẻo của Nguyễn Nhật Ánh.",
    variants: [{ sku: "hoa-vang-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } }],
    offers: [
      { vendor: "vendorAn", priceUsd: "6.20", stockQuantity: 30 },
      { vendor: "vendorPhuongNam", priceUsd: "6.10", listPriceUsd: "8.00", stockQuantity: 11 },
    ],
  },
  {
    slug: "cho-toi-xin-mot-ve-di-tuoi-tho",
    categorySlug: "thieu-nhi",
    title: "Cho Tôi Xin Một Vé Đi Tuổi Thơ",
    description: "Những trang viết dí dỏm mời người lớn quay lại khu vườn tuổi thơ của chính mình.",
    variants: [{ sku: "ve-tuoi-tho-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } }],
    offers: [{ vendor: "vendorPhuongNam", priceUsd: "5.40", stockQuantity: 18 }],
  },
  {
    slug: "hoang-tu-be",
    categorySlug: "thieu-nhi",
    title: "Hoàng Tử Bé",
    description: "Bản dịch tiếng Việt của câu chuyện ngụ ngôn nổi tiếng về tình bạn và cách nhìn thế giới bằng trái tim.",
    variants: [
      { sku: "hoang-tu-be-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } },
      { sku: "hoang-tu-be-song-ngu", title: "Song ngữ", attributes: { format: "bilingual" } },
    ],
    offers: [
      { vendor: "vendorAn", priceUsd: "3.90", listPriceUsd: "5.50", stockQuantity: 40 },
      { vendor: "vendorPhuongNam", priceUsd: "3.90", stockQuantity: 5 },
    ],
  },
  {
    slug: "dac-nhan-tam",
    categorySlug: "ky-nang",
    title: "Đắc Nhân Tâm",
    description: "Cẩm nang giao tiếp và ứng xử được đọc nhiều nhất, bản tiếng Việt có lời bàn.",
    variants: [{ sku: "dac-nhan-tam-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } }],
    offers: [
      { vendor: "vendorPhuongNam", priceUsd: "8.10", listPriceUsd: "10.00", stockQuantity: 22 },
      { vendor: "vendorAn", priceUsd: "8.40", stockQuantity: 9 },
    ],
  },
  {
    slug: "nha-gia-kim",
    categorySlug: "ky-nang",
    title: "Nhà Giả Kim",
    description: "Hành trình của cậu bé chăn cừu đi tìm kho báu và nhận ra vận mệnh của chính mình.",
    variants: [{ sku: "nha-gia-kim-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } }],
    offers: [{ vendor: "vendorAn", priceUsd: "6.80", stockQuantity: 14 }],
  },
  {
    slug: "nhat-ky-trong-tu",
    categorySlug: "van-hoc",
    title: "Nhật Ký Trong Tù",
    description: "Tập thơ chữ Hán kèm bản dịch tiếng Việt, có phần dẫn nhập lịch sử.",
    variants: [{ sku: "nhat-ky-trong-tu-bia-cung", title: "Bìa cứng", attributes: { format: "hardcover" } }],
    offers: [{ vendor: "vendorPhuongNam", priceUsd: "5.95", stockQuantity: 7 }],
  },
  {
    // Deliberately unavailable: exercises the "Tạm hết hàng" buy-box state.
    slug: "mat-biec",
    categorySlug: "van-hoc",
    title: "Mắt Biếc",
    description: "Chuyện tình buồn của Ngạn và Hà Lan, một trong những tác phẩm được yêu thích nhất của Nguyễn Nhật Ánh.",
    variants: [{ sku: "mat-biec-bia-mem", title: "Bìa mềm", attributes: { format: "paperback" } }],
    offers: [
      { vendor: "vendorAn", priceUsd: "5.60", stockQuantity: 0 },
      { vendor: "vendorPhuongNam", priceUsd: "5.30", stockQuantity: 4, isActive: false },
    ],
  },
]);

function upsertUser(auth, { email, role }, passwordHash) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error(`Seed user email is invalid: ${email}`);
  const existing = auth.db.prepare("SELECT id, role FROM users WHERE email = ?").get(normalized);
  if (existing) {
    auth.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, existing.id);
    return { id: existing.id, email: normalized, role: existing.role, created: false };
  }
  const id = seedIdentifier("user", normalized);
  auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, normalized, passwordHash, role, auth.now());
  return { id, email: normalized, role, created: true };
}

function upsertCategory(catalog, definition) {
  const existing = catalog.db.prepare("SELECT id FROM categories WHERE slug = ?").get(definition.slug);
  if (existing) return { id: existing.id, created: false };
  return { id: createCategory(catalog, definition).id, created: true };
}

function upsertProduct(catalog, definition, categoryId) {
  const existing = catalog.db.prepare("SELECT id FROM products WHERE slug = ?").get(definition.slug);
  if (!existing) {
    const product = createProduct(catalog, {
      categoryId,
      slug: definition.slug,
      title: definition.title,
      description: definition.description,
    });
    return { id: product.id, created: true };
  }
  catalog.db.prepare("UPDATE products SET category_id = ?, title = ?, description = ?, updated_at = ? WHERE id = ?")
    .run(categoryId, definition.title, definition.description, catalog.now(), existing.id);
  return { id: existing.id, created: false };
}

function upsertVariant(catalog, productId, variant) {
  const existing = catalog.db.prepare("SELECT id FROM product_variants WHERE sku = ?").get(variant.sku);
  if (existing) return { id: existing.id, created: false };
  return { id: createProductVariant(catalog, { productId, ...variant }).id, created: true };
}

function upsertMedia(catalog, productId, url, altText) {
  const existing = catalog.db.prepare("SELECT id FROM product_media WHERE product_id = ? AND url = ?").get(productId, url);
  if (existing) return { id: existing.id, created: false };
  return { id: addProductMedia(catalog, { productId, url, altText }).id, created: true };
}

function seedCatalog(catalog, vendors, counters) {
  const categories = new Map();
  for (const definition of SEED_CATEGORIES) {
    const category = upsertCategory(catalog, definition);
    if (category.created) counters.categories += 1;
    categories.set(definition.slug, category.id);
  }
  const offersByProduct = new Map();
  for (const definition of SEED_PRODUCTS) {
    const categoryId = categories.get(definition.categorySlug);
    if (!categoryId) throw new Error(`Seed product ${definition.slug} references an unknown category.`);
    const product = upsertProduct(catalog, definition, categoryId);
    if (product.created) counters.products += 1;
    if (upsertMedia(catalog, product.id, `https://cdn.example.test/covers/${definition.slug}.jpg`, definition.title).created) {
      counters.media += 1;
    }
    for (const variant of definition.variants) {
      if (upsertVariant(catalog, product.id, variant).created) counters.variants += 1;
    }
    const offerIds = [];
    for (const offer of definition.offers) {
      const vendor = vendors.get(offer.vendor);
      if (!vendor) throw new Error(`Seed offer for ${definition.slug} references an unknown vendor.`);
      const offerId = seedIdentifier("offer", `${definition.slug}:${offer.vendor}`);
      const isNew = !catalog.db.prepare("SELECT id FROM vendor_offers WHERE id = ?").get(offerId);
      const written = writeVendorOffer(catalog, { id: vendor.id, role: "vendor" }, {
        id: offerId,
        productId: product.id,
        vendorId: vendor.id,
        priceUsd: offer.priceUsd,
        listPriceUsd: offer.listPriceUsd,
        stockQuantity: offer.stockQuantity,
        isActive: offer.isActive !== false,
      });
      if (isNew) counters.offers += 1;
      offerIds.push({ ...written, vendorKey: offer.vendor });
    }
    offersByProduct.set(definition.slug, { productId: product.id, offers: offerIds });
  }
  return offersByProduct;
}

function seedOrders(commerce, customer, catalogIndex, counters) {
  const existing = commerce.db.prepare("SELECT COUNT(*) AS count FROM orders WHERE user_id = ?").get(customer.id);
  if (existing.count > 0) return { paidOrderId: null, pendingOrderId: null };
  const paidOrder = createPendingOrder(commerce, customer, [
    { vendorOfferId: catalogIndex.get("truyen-kieu").offers.find((offer) => offer.vendorKey === "vendorAn").id, quantity: 1 },
    { vendorOfferId: catalogIndex.get("hoang-tu-be").offers.find((offer) => offer.vendorKey === "vendorAn").id, quantity: 2, giftWrap: true },
  ]);
  commerce.db.prepare("UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?").run(commerce.clock(), paidOrder.id);
  const pendingOrder = createPendingOrder(commerce, customer, [
    { vendorOfferId: catalogIndex.get("dac-nhan-tam").offers.find((offer) => offer.vendorKey === "vendorPhuongNam").id, quantity: 1, plasticCover: true },
  ]);
  counters.orders += 2;
  return { paidOrderId: paidOrder.id, pendingOrderId: pendingOrder.id };
}

function seedPayout(vendorCommerce, admin, vendor, orderId, counters) {
  if (!orderId) return null;
  const lines = vendorCommerce.db.prepare(`
    SELECT order_items.id AS orderItemId, order_items.unit_price_usd AS unitPriceUsd, order_items.quantity
    FROM order_items
    JOIN vendor_offers ON vendor_offers.id = order_items.vendor_offer_id
    WHERE order_items.order_id = ? AND vendor_offers.vendor_id = ?
    ORDER BY order_items.id ASC
  `).all(orderId, vendor.id);
  if (!lines.length) return null;
  const amountUsd = moneyString(lines.reduce((sum, line) => sum + moneyUnits(line.unitPriceUsd) * BigInt(line.quantity), 0n));
  const payout = createVendorPayout(vendorCommerce, admin, {
    vendorId: vendor.id,
    amountUsd,
    orderItemIds: lines.map((line) => line.orderItemId),
  });
  counters.payouts += 1;
  return payout;
}

function seedNotifications(notifications, actor, messages, counters) {
  for (const message of messages) {
    const existing = notifications.db
      .prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND event_type = ?")
      .get(message.userId, message.eventType);
    if (existing.count > 0) continue;
    if (createNotification(notifications, actor, message)) counters.notifications += 1;
  }
}

/**
 * Populate the local SQLite database with a storefront + admin walkthrough dataset.
 * Safe to re-run: catalog rows are upserted, and transactional records (orders,
 * payouts, applications, notifications, support records) are created only when absent.
 */
export function seedLocalData({
  dbPath = process.env.DATABASE_PATH || "/data/sachviet.sqlite",
  password = generateSeedPassword(),
  env = process.env,
  clock = () => Date.now(),
  log = () => {},
} = {}) {
  const storeOptions = { dbPath, log };
  const auth = createAuthStore({ ...storeOptions, now: clock });
  const catalog = createCatalogStore({ ...storeOptions, now: clock });
  const commerce = createCommerceStore({ ...storeOptions, clock });
  const adminCommerce = createAdminCommerceStore({ ...storeOptions, clock });
  const vendorCommerce = createVendorCommerceStore({ ...storeOptions, clock });
  const notifications = createNotificationStore({ ...storeOptions, clock });
  const support = createSupportStore({ ...storeOptions, clock });
  const counters = {
    users: 0, categories: 0, products: 0, variants: 0, media: 0, offers: 0,
    orders: 0, payouts: 0, vendorApplications: 0, notifications: 0, reviews: 0, tickets: 0,
  };

  try {
    // Runs before any seed user exists so an operator-configured bootstrap admin is preserved.
    const bootstrap = bootstrapFirstAdmin(auth, env);
    const passwordHash = hashPassword(password);
    const users = new Map();
    for (const definition of SEED_USERS) {
      const user = upsertUser(auth, definition, passwordHash);
      if (user.created) counters.users += 1;
      users.set(definition.key, user);
    }

    const catalogIndex = seedCatalog(catalog, users, counters);
    const admin = users.get("admin");
    const customer = users.get("customer");
    const applicant = users.get("applicant");
    const vendorAn = users.get("vendorAn");

    const orders = seedOrders(commerce, customer, catalogIndex, counters);
    const payout = seedPayout(vendorCommerce, admin, vendorAn, orders.paidOrderId, counters);

    const hasApplication = adminCommerce.db.prepare("SELECT COUNT(*) AS count FROM vendor_applications WHERE user_id = ?").get(applicant.id);
    if (hasApplication.count === 0) {
      submitVendorApplication(adminCommerce, { id: applicant.id, role: "customer" });
      counters.vendorApplications += 1;
    }

    seedNotifications(notifications, admin, [
      { userId: customer.id, eventType: "order.paid", title: "Đơn hàng đã thanh toán", body: "Đơn hàng mẫu của bạn đã được ghi nhận là đã thanh toán.", deeplinkPath: "/ecom/orders" },
      { userId: vendorAn.id, eventType: "payout.created", title: "Đã tạo khoản thanh toán", body: "Một khoản thanh toán mẫu đã được tạo cho gian hàng của bạn.", deeplinkPath: "/vendor" },
      { userId: admin.id, eventType: "vendor.application_submitted", title: "Đơn đăng ký nhà bán mới", body: "Một khách hàng mẫu đã gửi đơn đăng ký nhà bán.", deeplinkPath: "/admin#vendors" },
    ], counters);

    if (support.db.prepare("SELECT COUNT(*) AS count FROM product_reviews WHERE user_id = ?").get(customer.id).count === 0) {
      createReview(support, customer, {
        productId: catalogIndex.get("truyen-kieu").productId,
        rating: 5,
        body: "Bản chú giải dễ đọc, giao hàng nhanh.",
      });
      counters.reviews += 1;
    }
    if (support.db.prepare("SELECT COUNT(*) AS count FROM support_tickets WHERE user_id = ?").get(customer.id).count === 0) {
      createTicket(support, customer, { subject: "Hỏi về thời gian giao hàng" });
      counters.tickets += 1;
    }

    return {
      databasePath: dbPath,
      password,
      bootstrapAdmin: bootstrap.reason,
      accounts: SEED_USERS.map((definition) => ({ email: users.get(definition.key).email, role: users.get(definition.key).role })),
      created: counters,
      orders,
      payoutId: payout?.id ?? null,
      totals: {
        products: catalog.db.prepare("SELECT COUNT(*) AS count FROM products").get().count,
        offers: catalog.db.prepare("SELECT COUNT(*) AS count FROM vendor_offers").get().count,
        orders: commerce.db.prepare("SELECT COUNT(*) AS count FROM orders").get().count,
        users: auth.db.prepare("SELECT COUNT(*) AS count FROM users").get().count,
      },
    };
  } finally {
    for (const store of [support, notifications, vendorCommerce, adminCommerce, commerce, catalog, auth]) store.close();
  }
}
