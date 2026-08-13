import { createHash, randomBytes } from "node:crypto";
import { createAccountStore, createAddress, updateAccount } from "./account-core.mjs";
import { createAdminCommerceStore, submitVendorApplication } from "./admin-commerce-core.mjs";
import { bootstrapFirstAdmin, createAuthStore, hashPassword, normalizeEmail } from "./auth-core.mjs";
import { createAuthorManuscriptRequest, createAuthorPortalStore } from "./author-portal-core.mjs";
import {
  addOrganizationMember,
  addSelectionListItem,
  createB2bQuoteStore,
  createOrganization,
  createSelectionList,
  requestQuoteFromSelectionList,
  setQuoteItemPrices,
  transitionQuoteStatus,
} from "./b2b-quote-core.mjs";
import { convertWonQuoteToOrder, createB2bOrderStore } from "./b2b-order-core.mjs";
import {
  addProductMedia,
  createCatalogStore,
  createCategory,
  createProduct,
  createProductVariant,
  writeVendorOffer,
} from "./catalog-core.mjs";
import { createCommerceStore, createPendingOrder } from "./commerce-core.mjs";
import { isLocalDatabaseHost } from "./db.mjs";
import { createEmployeeRetailStore, setRetailOrderItemFulfillment } from "./employee-retail-core.mjs";
import { submitInstitutionPurchaseOrder, createInstitutionBuyerStore } from "./institution-buyer-core.mjs";
import { createNotification, createNotificationStore } from "./notification-core.mjs";
import {
  createPublisherPortalStore,
  createPublishingRequest,
  registerPublisherMarcRecord,
} from "./publisher-portal-core.mjs";
import { createStorageStore, putStoredObject } from "./storage-core.mjs";
import { assignTicket, createReview, createSupportStore, createTicket } from "./support-core.mjs";
import { createVendorCommerceStore, createVendorPayout, setOrderItemFulfillment } from "./vendor-commerce-core.mjs";

export function assertSeedDatabaseTarget({
  env = process.env,
  databaseUrl,
  dbPath,
} = {}) {
  if (env.NODE_ENV === "production") {
    throw new Error("seed:local refuses to run when NODE_ENV=production.");
  }
  if (dbPath) return;
  const url = databaseUrl || env.DATABASE_URL;
  if (!url) {
    throw new Error("seed:local requires DATABASE_URL when DATABASE_PATH is not set.");
  }
  if (!isLocalDatabaseHost(url)) {
    throw new Error("seed:local refuses DATABASE_URL hosts that are not loopback or Compose db.");
  }
}

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
  { key: "employee", email: "nhan-vien.seed@sachviet.test", role: "employee" },
  { key: "retail", email: "ban-le.seed@sachviet.test", role: "employee_b2c" },
  { key: "b2b", email: "b2b.seed@sachviet.test", role: "employee_b2b" },
  { key: "librarian", email: "thu-vien.seed@sachviet.test", role: "school_librarian" },
  { key: "publisher", email: "nxb.seed@sachviet.test", role: "publisher" },
  { key: "author", email: "tac-gia.seed@sachviet.test", role: "author" },
  { key: "supplier", email: "ncc.seed@sachviet.test", role: "employee_supplier" },
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

async function upsertUser(auth, { email, role }, passwordHash) {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error(`Seed user email is invalid: ${email}`);
  const existing = await auth.db.prepare("SELECT id, role FROM users WHERE email = ?").get(normalized);
  if (existing) {
    await auth.db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, existing.id);
    return { id: existing.id, email: normalized, role: existing.role, created: false };
  }
  const id = seedIdentifier("user", normalized);
  await auth.db.prepare("INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(id, normalized, passwordHash, role, auth.now());
  return { id, email: normalized, role, created: true };
}

async function upsertCategory(catalog, definition) {
  const existing = await catalog.db.prepare("SELECT id FROM categories WHERE slug = ?").get(definition.slug);
  if (existing) return { id: existing.id, created: false };
  return { id: (await createCategory(catalog, definition)).id, created: true };
}

async function upsertProduct(catalog, definition, categoryId) {
  const existing = await catalog.db.prepare("SELECT id FROM products WHERE slug = ?").get(definition.slug);
  if (!existing) {
    const product = await createProduct(catalog, {
      categoryId,
      slug: definition.slug,
      title: definition.title,
      description: definition.description,
    });
    return { id: product.id, created: true };
  }
  await catalog.db.prepare("UPDATE products SET category_id = ?, title = ?, description = ?, updated_at = ? WHERE id = ?")
    .run(categoryId, definition.title, definition.description, catalog.now(), existing.id);
  return { id: existing.id, created: false };
}

async function upsertVariant(catalog, productId, variant) {
  const existing = await catalog.db.prepare("SELECT id FROM product_variants WHERE sku = ?").get(variant.sku);
  if (existing) return { id: existing.id, created: false };
  return { id: (await createProductVariant(catalog, { productId, ...variant })).id, created: true };
}

async function upsertMedia(catalog, productId, url, altText) {
  const existing = await catalog.db.prepare("SELECT id FROM product_media WHERE product_id = ? AND url = ?").get(productId, url);
  if (existing) return { id: existing.id, created: false };
  return { id: (await addProductMedia(catalog, { productId, url, altText })).id, created: true };
}

async function seedCatalog(catalog, vendors, counters) {
  const categories = new Map();
  for (const definition of SEED_CATEGORIES) {
    const category = await upsertCategory(catalog, definition);
    if (category.created) counters.categories += 1;
    categories.set(definition.slug, category.id);
  }
  const offersByProduct = new Map();
  for (const definition of SEED_PRODUCTS) {
    const categoryId = categories.get(definition.categorySlug);
    if (!categoryId) throw new Error(`Seed product ${definition.slug} references an unknown category.`);
    const product = await upsertProduct(catalog, definition, categoryId);
    if (product.created) counters.products += 1;
    if ((await upsertMedia(catalog, product.id, `https://cdn.example.test/covers/${definition.slug}.jpg`, definition.title)).created) {
      counters.media += 1;
    }
    for (const variant of definition.variants) {
      if ((await upsertVariant(catalog, product.id, variant)).created) counters.variants += 1;
    }
    const offerIds = [];
    for (const offer of definition.offers) {
      const vendor = vendors.get(offer.vendor);
      if (!vendor) throw new Error(`Seed offer for ${definition.slug} references an unknown vendor.`);
      const offerId = seedIdentifier("offer", `${definition.slug}:${offer.vendor}`);
      const isNew = !await catalog.db.prepare("SELECT id FROM vendor_offers WHERE id = ?").get(offerId);
      const written = await writeVendorOffer(catalog, { id: vendor.id, role: "vendor" }, {
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

async function seedOrders(commerce, customer, catalogIndex, counters) {
  const existing = await commerce.db.prepare("SELECT id, status FROM orders WHERE user_id = ? ORDER BY created_at ASC, id ASC").all(customer.id);
  if (existing.length > 0) {
    return {
      paidOrderId: existing.find((row) => row.status === "paid")?.id ?? null,
      pendingOrderId: existing.find((row) => row.status === "pending_payment")?.id ?? null,
    };
  }
  const paidOrder = await createPendingOrder(commerce, customer, [
    { vendorOfferId: (catalogIndex.get("truyen-kieu")).offers.find((offer) => offer.vendorKey === "vendorAn").id, quantity: 1 },
    { vendorOfferId: (catalogIndex.get("hoang-tu-be")).offers.find((offer) => offer.vendorKey === "vendorAn").id, quantity: 2, giftWrap: true },
  ]);
  await commerce.db.prepare("UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?").run(commerce.clock(), paidOrder.id);
  const pendingOrder = await createPendingOrder(commerce, customer, [
    { vendorOfferId: (catalogIndex.get("dac-nhan-tam")).offers.find((offer) => offer.vendorKey === "vendorPhuongNam").id, quantity: 1, plasticCover: true },
  ]);
  counters.orders += 2;
  return { paidOrderId: paidOrder.id, pendingOrderId: pendingOrder.id };
}

async function seedPayout(vendorCommerce, admin, vendor, orderId, counters) {
  if (!orderId) return null;
  const lines = await vendorCommerce.db.prepare(`
    SELECT order_items.id AS orderItemId, order_items.unit_price_usd AS unitPriceUsd, order_items.quantity
    FROM order_items
    JOIN vendor_offers ON vendor_offers.id = order_items.vendor_offer_id
    WHERE order_items.order_id = ? AND vendor_offers.vendor_id = ?
    ORDER BY order_items.id ASC
  `).all(orderId, vendor.id);
  if (!lines.length) return null;
  const existing = await vendorCommerce.db.prepare(`
    SELECT payout_items.payout_id AS payoutId
    FROM payout_items
    WHERE payout_items.order_item_id = ?
    LIMIT 1
  `).get(lines[0].orderItemId);
  if (existing?.payoutId) return { id: existing.payoutId };
  const amountUsd = moneyString(lines.reduce((sum, line) => sum + moneyUnits(line.unitPriceUsd) * BigInt(line.quantity), 0n));
  const payout = await createVendorPayout(vendorCommerce, admin, {
    vendorId: vendor.id,
    amountUsd,
    orderItemIds: lines.map((line) => line.orderItemId),
  });
  counters.payouts += 1;
  return payout;
}

async function seedOpaqueObject(storage, ownerId, label) {
  return await putStoredObject(storage, {
    bytes: Buffer.from(`sachviet-seed:${label}`, "utf8"),
    contentType: "text/plain",
    ownerId,
  });
}

async function seedPortalWalkthrough({
  account,
  support,
  vendorCommerce,
  retail,
  quotes,
  b2bOrders,
  institution,
  publisher,
  author,
  storage,
  users,
  catalogIndex,
  orders,
  counters,
}) {
  const admin = users.get("admin");
  const customer = users.get("customer");
  const vendorAn = users.get("vendorAn");
  const employee = users.get("employee");
  const retailUser = users.get("retail");
  const b2b = users.get("b2b");
  const librarian = users.get("librarian");
  const publisherUser = users.get("publisher");
  const authorUser = users.get("author");
  const walkthrough = {
    customer: {},
    vendor: {},
    admin: {},
    employee: {},
    retail: {},
    b2b: {},
    institution: {},
    publisher: {},
    author: {},
  };

  const updated = await updateAccount(account, customer, { locale: "en" });
  walkthrough.customer.locale = updated.locale;
  if ((await account.db.prepare("SELECT COUNT(*) AS count FROM user_addresses WHERE user_id = ?").get(customer.id)).count === 0) {
    const address = await createAddress(account, customer, {
      label: "Nhà",
      line1: "123 Đường Sách",
      city: "Hà Nội",
      region: "HN",
      postalCode: "100000",
      country: "VN",
    });
    counters.addresses += 1;
    walkthrough.customer.addressId = address.id;
  } else {
    walkthrough.customer.addressId = (await account.db.prepare("SELECT id FROM user_addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(customer.id)).id;
  }
  walkthrough.customer.paidOrderId = orders.paidOrderId;
  walkthrough.customer.pendingOrderId = orders.pendingOrderId;

  if (orders.paidOrderId) {
    const vendorLine = await vendorCommerce.db.prepare(`
      SELECT order_items.id
      FROM order_items
      JOIN vendor_offers ON vendor_offers.id = order_items.vendor_offer_id
      WHERE order_items.order_id = ? AND vendor_offers.vendor_id = ?
      ORDER BY order_items.id ASC
      LIMIT 1
    `).get(orders.paidOrderId, vendorAn.id);
    if (vendorLine) {
      const current = await vendorCommerce.db.prepare("SELECT fulfillment_status AS fulfillmentStatus FROM order_items WHERE id = ?").get(vendorLine.id);
      if (!current.fulfillmentStatus) {
        await setOrderItemFulfillment(vendorCommerce, vendorAn, { orderItemId: vendorLine.id, fulfillmentStatus: "packing" });
        counters.fulfillments += 1;
      }
      walkthrough.vendor.orderItemId = vendorLine.id;
      walkthrough.vendor.fulfillmentStatus = "packing";
    }
    const retailLine = await retail.db.prepare(`
      SELECT id FROM order_items WHERE order_id = ? ORDER BY id DESC LIMIT 1
    `).get(orders.paidOrderId);
    if (retailLine) {
      const current = await retail.db.prepare("SELECT fulfillment_status AS fulfillmentStatus FROM order_items WHERE id = ?").get(retailLine.id);
      if (current.fulfillmentStatus !== "shipped" && current.fulfillmentStatus !== "delivered") {
        await setRetailOrderItemFulfillment(retail, retailUser, { orderItemId: retailLine.id, fulfillmentStatus: "shipped" });
        counters.fulfillments += 1;
      }
      walkthrough.retail.paidOrderId = orders.paidOrderId;
      walkthrough.retail.orderItemId = retailLine.id;
    }
  }

  const ticket = await support.db.prepare("SELECT id, assignee_id AS assigneeId FROM support_tickets WHERE user_id = ? ORDER BY created_at ASC LIMIT 1").get(customer.id);
  if (ticket && !ticket.assigneeId) {
    await assignTicket(support, employee, { ticketId: ticket.id, assigneeId: employee.id });
    counters.assignedTickets += 1;
  }
  walkthrough.employee.assignedTicketId = ticket?.id ?? null;

  if ((await quotes.db.prepare("SELECT COUNT(*) AS count FROM organizations").get()).count === 0) {
    const org = await createOrganization(quotes, b2b, { name: "Thư viện seed Sách Việt" });
    await addOrganizationMember(quotes, b2b, { organizationId: org.id, userId: librarian.id });
    const list = await createSelectionList(quotes, librarian, { title: "Danh mục seed" });
    await addSelectionListItem(quotes, librarian, {
      selectionListId: list.id,
      productId: catalogIndex.get("truyen-kieu").productId,
      quantity: 2,
    });
    const quote = await requestQuoteFromSelectionList(quotes, librarian, { selectionListId: list.id });
    await setQuoteItemPrices(quotes, b2b, { quoteId: quote.id, items: [{ id: quote.items[0].id, unitPriceUsd: "7.00" }] });
    await transitionQuoteStatus(quotes, b2b, { quoteId: quote.id, status: "sent" });
    await transitionQuoteStatus(quotes, b2b, { quoteId: quote.id, status: "negotiating" });
    await transitionQuoteStatus(quotes, b2b, { quoteId: quote.id, status: "won" });
    const order = await convertWonQuoteToOrder(b2bOrders, b2b, { quoteId: quote.id });
    const po = await seedOpaqueObject(storage, librarian.id, "institution-po");
    await submitInstitutionPurchaseOrder(institution, librarian, {
      orderId: order.id,
      referenceNumber: "PO-SEED-1001",
      storageKey: po.key,
    });
    counters.organizations += 1;
    counters.quotes += 1;
    counters.b2bOrders += 1;
    counters.purchaseOrders += 1;
    walkthrough.b2b = { organizationId: org.id, quoteId: quote.id, orderId: order.id };
    walkthrough.institution = { orderId: order.id, purchaseOrderKey: po.key };
  } else {
    const org = await quotes.db.prepare("SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1").get();
    const quote = await quotes.db.prepare("SELECT id FROM b2b_quotes ORDER BY created_at ASC LIMIT 1").get();
    const order = await b2bOrders.db.prepare("SELECT id FROM b2b_orders ORDER BY created_at ASC LIMIT 1").get();
    walkthrough.b2b = { organizationId: org?.id ?? null, quoteId: quote?.id ?? null, orderId: order?.id ?? null };
    walkthrough.institution = { orderId: order?.id ?? null };
  }

  if ((await publisher.db.prepare("SELECT COUNT(*) AS count FROM publishing_requests WHERE publisher_id = ?").get(publisherUser.id)).count === 0) {
    const asset = await seedOpaqueObject(storage, publisherUser.id, "publisher-manuscript");
    const request = await createPublishingRequest(publisher, publisherUser, {
      title: "Bản thảo seed",
      storageKey: asset.key,
    });
    counters.publishingRequests += 1;
    walkthrough.publisher.requestId = request.id;
  } else {
    walkthrough.publisher.requestId = (await publisher.db.prepare("SELECT id FROM publishing_requests WHERE publisher_id = ? ORDER BY created_at ASC LIMIT 1").get(publisherUser.id)).id;
  }
  if ((await publisher.db.prepare("SELECT COUNT(*) AS count FROM publisher_marc_records WHERE publisher_id = ?").get(publisherUser.id)).count === 0) {
    const marc = await seedOpaqueObject(storage, publisherUser.id, "publisher-marc");
    await registerPublisherMarcRecord(publisher, publisherUser, {
      productId: catalogIndex.get("truyen-kieu").productId,
      storageKey: marc.key,
    });
    counters.marcRecords += 1;
  }
  walkthrough.publisher.marcProductId = catalogIndex.get("truyen-kieu").productId;

  if ((await author.db.prepare("SELECT COUNT(*) AS count FROM author_manuscript_requests WHERE author_id = ?").get(authorUser.id)).count === 0) {
    const asset = await seedOpaqueObject(storage, authorUser.id, "author-manuscript");
    const request = await createAuthorManuscriptRequest(author, authorUser, {
      title: "Bản thảo tác giả seed",
      storageKey: asset.key,
    });
    counters.manuscriptRequests += 1;
    walkthrough.author.requestId = request.id;
  } else {
    walkthrough.author.requestId = (await author.db.prepare("SELECT id FROM author_manuscript_requests WHERE author_id = ? ORDER BY created_at ASC LIMIT 1").get(authorUser.id)).id;
  }

  walkthrough.admin = { catalogProducts: catalogIndex.size, paidOrderId: orders.paidOrderId };
  return walkthrough;
}

async function seedNotifications(notifications, actor, messages, counters) {
  for (const message of messages) {
    const existing = await notifications.db
      .prepare("SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND event_type = ?")
      .get(message.userId, message.eventType);
    if (existing.count > 0) continue;
    if (await createNotification(notifications, actor, message)) counters.notifications += 1;
  }
}

/**
 * Populate the local Postgres database with a storefront + admin walkthrough dataset.
 * Safe to re-run: catalog rows are upserted, and transactional records (orders,
 * payouts, applications, notifications, support records) are created only when absent.
 *
 * Prefer DATABASE_URL. Pass dbPath only for schema-isolated test environments.
 */
export async function seedLocalData({
  databaseUrl,
  dbPath,
  password = generateSeedPassword(),
  env = process.env,
  clock = () => Date.now(),
  log = () => {},
} = {}) {
  // Prefer an explicit dbPath (schema-isolated tests). Only fall back to
  // DATABASE_URL when the caller did not ask for path-based isolation.
  assertSeedDatabaseTarget({ env, databaseUrl, dbPath });
  const resolvedUrl = databaseUrl ?? (dbPath ? undefined : process.env.DATABASE_URL);
  const storeOptions = dbPath
    ? { dbPath, databaseUrl: resolvedUrl, log }
    : { databaseUrl: resolvedUrl || process.env.DATABASE_URL, log };
  const connectionTarget = dbPath || resolvedUrl || process.env.DATABASE_URL;
  const auth = await createAuthStore({ ...storeOptions, now: clock });
  const catalog = await createCatalogStore({ ...storeOptions, now: clock });
  const commerce = await createCommerceStore({ ...storeOptions, clock });
  const adminCommerce = await createAdminCommerceStore({ ...storeOptions, clock });
  const vendorCommerce = await createVendorCommerceStore({ ...storeOptions, clock });
  const notifications = await createNotificationStore({ ...storeOptions, clock });
  const support = await createSupportStore({ ...storeOptions, clock });
  const account = await createAccountStore({ ...storeOptions, now: clock });
  const retail = await createEmployeeRetailStore({ ...storeOptions, clock });
  const quotes = await createB2bQuoteStore({ ...storeOptions, clock });
  const b2bOrders = await createB2bOrderStore({ ...storeOptions, clock });
  const institution = await createInstitutionBuyerStore({ ...storeOptions, clock });
  const publisher = await createPublisherPortalStore({ ...storeOptions, clock });
  const author = await createAuthorPortalStore({ ...storeOptions, clock });
  const storage = await createStorageStore({ ...storeOptions, clock });
  const counters = {
    users: 0, categories: 0, products: 0, variants: 0, media: 0, offers: 0,
    orders: 0, payouts: 0, vendorApplications: 0, notifications: 0, reviews: 0, tickets: 0,
    addresses: 0, assignedTickets: 0, fulfillments: 0, organizations: 0, quotes: 0,
    b2bOrders: 0, purchaseOrders: 0, publishingRequests: 0, marcRecords: 0, manuscriptRequests: 0,
  };

  try {
    // Runs before any seed user exists so an operator-configured bootstrap admin is preserved.
    const bootstrap = await bootstrapFirstAdmin(auth, env);
    const passwordHash = hashPassword(password);
    const users = new Map();
    for (const definition of SEED_USERS) {
      const user = await upsertUser(auth, definition, passwordHash);
      if (user.created) counters.users += 1;
      users.set(definition.key, user);
    }

    const catalogIndex = await seedCatalog(catalog, users, counters);
    const admin = users.get("admin");
    const customer = users.get("customer");
    const applicant = users.get("applicant");
    const vendorAn = users.get("vendorAn");

    const orders = await seedOrders(commerce, customer, catalogIndex, counters);
    const payout = await seedPayout(vendorCommerce, admin, vendorAn, orders.paidOrderId, counters);

    const hasApplication = await adminCommerce.db.prepare("SELECT COUNT(*) AS count FROM vendor_applications WHERE user_id = ?").get(applicant.id);
    if (hasApplication.count === 0) {
      await submitVendorApplication(adminCommerce, { id: applicant.id, role: "customer" });
      counters.vendorApplications += 1;
    }

    await seedNotifications(notifications, admin, [
      { userId: customer.id, eventType: "order.paid", title: "Đơn hàng đã thanh toán", body: "Đơn hàng mẫu của bạn đã được ghi nhận là đã thanh toán.", deeplinkPath: "/ecom/orders" },
      { userId: vendorAn.id, eventType: "payout.created", title: "Đã tạo khoản thanh toán", body: "Một khoản thanh toán mẫu đã được tạo cho gian hàng của bạn.", deeplinkPath: "/vendor" },
      { userId: admin.id, eventType: "vendor.application_submitted", title: "Đơn đăng ký nhà bán mới", body: "Một khách hàng mẫu đã gửi đơn đăng ký nhà bán.", deeplinkPath: "/admin#vendors" },
    ], counters);

    if ((await support.db.prepare("SELECT COUNT(*) AS count FROM product_reviews WHERE user_id = ?").get(customer.id)).count === 0) {
      await createReview(support, customer, {
        productId: (catalogIndex.get("truyen-kieu")).productId,
        rating: 5,
        body: "Bản chú giải dễ đọc, giao hàng nhanh.",
      });
      counters.reviews += 1;
    }
    if ((await support.db.prepare("SELECT COUNT(*) AS count FROM support_tickets WHERE user_id = ?").get(customer.id)).count === 0) {
      await createTicket(support, customer, { subject: "Hỏi về thời gian giao hàng" });
      counters.tickets += 1;
    }

    const walkthrough = await seedPortalWalkthrough({
      account,
      support,
      vendorCommerce,
      retail,
      quotes,
      b2bOrders,
      institution,
      publisher,
      author,
      storage,
      users,
      catalogIndex,
      orders,
      counters,
    });

    return {
      databaseUrl: connectionTarget,
      password,
      bootstrapAdmin: bootstrap.reason,
      accounts: SEED_USERS.map((definition) => ({ email: (users.get(definition.key)).email, role: (users.get(definition.key)).role })),
      created: counters,
      orders,
      payoutId: payout?.id ?? null,
      walkthrough,
      totals: {
        products: (await catalog.db.prepare("SELECT COUNT(*) AS count FROM products").get()).count,
        offers: (await catalog.db.prepare("SELECT COUNT(*) AS count FROM vendor_offers").get()).count,
        orders: (await commerce.db.prepare("SELECT COUNT(*) AS count FROM orders").get()).count,
        users: (await auth.db.prepare("SELECT COUNT(*) AS count FROM users").get()).count,
      },
    };
  } finally {
    for (const store of [
      storage, author, publisher, institution, b2bOrders, quotes, retail, account,
      support, notifications, vendorCommerce, adminCommerce, commerce, catalog, auth,
    ]) await store.close();
  }
}
