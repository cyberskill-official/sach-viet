import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createCommerceStore, expirePendingOrders } from "../src/lib/commerce-core.mjs";
import { processOrderCommsOutbox } from "../src/lib/order-comms-core.mjs";

/**
 * One schedule: expire abandoned pending_payment rows (restock) then drain due
 * comms. Safe to run on a timer — delivered entries are never reclaimed, and
 * entries still inside their backoff window are skipped.
 */
export async function drainOrderCommsOutbox({ dbPath, limit = 50, expireLimit = 50 } = {}) {
  const store = await createCommerceStore({ dbPath });
  try {
    const expired = await expirePendingOrders(store, { limit: expireLimit });
    const summary = await processOrderCommsOutbox(store, { limit });
    return { expired, summary };
  } finally {
    await store.close();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  drainOrderCommsOutbox({
    limit: Number(process.env.ORDER_COMMS_DRAIN_LIMIT || 50),
    expireLimit: Number(process.env.PENDING_ORDER_EXPIRE_LIMIT || 50),
  })
    .then((result) => {
      console.info(JSON.stringify({ event: "order_comms_outbox_drained", result: "completed", ...result }));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
