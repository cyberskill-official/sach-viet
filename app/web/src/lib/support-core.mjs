import { randomBytes } from "node:crypto";
import { openDatabase, tableExists } from "./db.mjs";
import { can, normalizeRole } from "./access.mjs";

const id = () => randomBytes(16).toString("hex");
const required = (value, name) => { if (typeof value !== "string" || value.trim() === "") throw new Error(`${name} is required.`); return value.trim(); };
const staff = (user) => can(user, "support.tickets.staff");

export async function createSupportStore({ dbPath, clock = () => Date.now(), log = (event, fields = {}) => console.info(JSON.stringify({ event, task_id: "TASK-REBUILD-006", ...fields })) } = {}) {
  const db = await openDatabase(dbPath);
  return { db, clock, log, close: () => db.close() };
}

export async function createTicket(store, user, input) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const ticket = { id: id(), userId: user.id, subject: required(input?.subject, "Ticket subject") };
  await store.db.prepare("INSERT INTO support_tickets (id, user_id, subject, created_at) VALUES (?, ?, ?, ?)").run(ticket.id, ticket.userId, ticket.subject, store.clock());
  store.log("support_ticket_created", { result: "accepted", ticket_id: ticket.id });
  return ticket;
}

/**
 * @param {*} store
 * @param {*} user
 * @param {{ after?: string, limit?: number }} [options]
 */
export async function listTickets(store, user, { after, limit = 50 } = {}) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const capped = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const clauses = staff(user) ? [] : ["user_id = ?"];
  const params = staff(user) ? [] : [user.id];
  if (after) {
    clauses.push("id < ?");
    params.push(after);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = await store.db
    .prepare(
      `SELECT id, user_id AS userId, subject, status, assignee_id AS assigneeId, created_at AS createdAt
       FROM support_tickets ${where}
       ORDER BY created_at DESC, id DESC
       LIMIT ?`,
    )
    .all(...params, capped + 1);
  const hasMore = rows.length > capped;
  const items = hasMore ? rows.slice(0, capped) : rows;
  return { items, nextCursor: hasMore ? items[items.length - 1].id : null };
}

export async function assignTicket(store, user, input = {}) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  if (!staff(user)) throw new Error("Ticket assignment is denied.");
  const ticketId = required(input.ticketId, "Ticket ID");
  const assigneeId = typeof input.assigneeId === "string" && input.assigneeId.trim() !== "" ? input.assigneeId.trim() : null;
  const ticket = await store.db.prepare("SELECT id FROM support_tickets WHERE id = ?").get(ticketId);
  if (!ticket) throw new Error("Ticket does not exist.");
  if (assigneeId) {
    const assignee = await store.db.prepare("SELECT id, role FROM users WHERE id = ?").get(assigneeId);
    if (!assignee || !staff(assignee)) throw new Error("Assignee must be staff.");
  }
  await store.db.prepare("UPDATE support_tickets SET assignee_id = ? WHERE id = ?").run(assigneeId, ticketId);
  store.log("support_ticket_assigned", { result: "accepted", ticket_id: ticketId, assignee_id: assigneeId });
  const row = await store.db
    .prepare(
      "SELECT id, user_id AS userId, subject, status, assignee_id AS assigneeId, created_at AS createdAt FROM support_tickets WHERE id = ?",
    )
    .get(ticketId);
  return row;
}

export async function addTicketMessage(store, user, input) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const ticket = await store.db.prepare("SELECT user_id FROM support_tickets WHERE id = ?").get(required(input?.ticketId, "Ticket ID"));
  if (!ticket || (!staff(user) && ticket.user_id !== user?.id)) throw new Error("Ticket access is denied.");
  const message = { id: id(), ticketId: input.ticketId, userId: user.id, body: required(input?.body, "Message") };
  await store.db.prepare("INSERT INTO ticket_messages (id, ticket_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)").run(message.id, message.ticketId, message.userId, message.body, store.clock());
  store.log("support_ticket_message_created", { result: "accepted", ticket_id: message.ticketId, actor_role: normalizeRole(user.role) });
  return message;
}

export async function listTicketMessages(store, user, ticketId) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const ticket = await store.db.prepare("SELECT user_id FROM support_tickets WHERE id = ?").get(required(ticketId, "Ticket ID"));
  if (!ticket || (!staff(user) && ticket.user_id !== user.id)) throw new Error("Ticket access is denied.");
  return await store.db.prepare("SELECT id, ticket_id AS ticketId, user_id AS userId, body, created_at AS createdAt FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC, id ASC").all(ticketId);
}

export async function createGoodsRequest(store, user, input) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const productId = typeof input?.productId === "string" && input.productId.trim() !== "" ? input.productId.trim() : null;
  if (productId && await tableExists(store.db, "products")) {
    if (!await store.db.prepare("SELECT 1 FROM products WHERE id = ? LIMIT 1").get(productId)) throw new Error("Requested product does not exist.");
  }
  const request = { id: id(), userId: user.id, productId, details: required(input?.details, "Goods request") };
  await store.db.prepare("INSERT INTO goods_requests (id, user_id, product_id, details, created_at) VALUES (?, ?, ?, ?, ?)").run(request.id, request.userId, request.productId, request.details, store.clock());
  store.log("goods_request_created", { result: "accepted", goods_request_id: request.id, has_product_context: Boolean(request.productId) });
  return request;
}

export async function listGoodsRequests(store, user) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const statement = staff(user)
    ? store.db.prepare("SELECT id, user_id AS userId, product_id AS productId, details, status, created_at AS createdAt FROM goods_requests ORDER BY created_at DESC, id DESC")
    : store.db.prepare("SELECT id, user_id AS userId, product_id AS productId, details, status, created_at AS createdAt FROM goods_requests WHERE user_id = ? ORDER BY created_at DESC, id DESC");
  return staff(user) ? await statement.all() : await statement.all(user.id);
}

export async function createReview(store, user, input) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  const productId = required(input?.productId, "Product ID");
  const paid = await store.db.prepare(`SELECT 1 FROM orders JOIN order_items ON order_items.order_id = orders.id WHERE orders.user_id = ? AND orders.status = 'paid' AND order_items.product_id = ? LIMIT 1`).get(user.id, productId);
  const review = { id: id(), userId: user.id, productId, rating: Number(input?.rating), body: required(input?.body, "Review") };
  if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) throw new Error("Review rating must be between 1 and 5.");
  await store.db.prepare("INSERT INTO product_reviews (id, user_id, product_id, rating, body, verified_purchase, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(review.id, review.userId, review.productId, review.rating, review.body, paid ? 1 : 0, store.clock());
  store.log("product_review_created", { result: "accepted", product_id: review.productId, verified_purchase: Boolean(paid) });
  return { ...review, verifiedPurchase: Boolean(paid) };
}
