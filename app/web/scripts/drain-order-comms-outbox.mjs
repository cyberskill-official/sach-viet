import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createCommerceStore } from "../src/lib/commerce-core.mjs";
import { processOrderCommsOutbox } from "../src/lib/order-comms-core.mjs";

/**
 * Retry sweep for confirmation comms that failed their inline dispatch. Safe to run on a timer:
 * delivered entries are never reclaimed, and entries still inside their backoff window are skipped.
 */
export async function drainOrderCommsOutbox({ dbPath, limit = 50 } = {}) {
  const store = await createCommerceStore({ dbPath });
  try {
    return await processOrderCommsOutbox(store, { limit });
  } finally {
    await store.close();
  }
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(resolve(invokedPath)).href) {
  drainOrderCommsOutbox({ limit: Number(process.env.ORDER_COMMS_DRAIN_LIMIT || 50) })
    .then((summary) => {
      console.info(JSON.stringify({ event: "order_comms_outbox_drained", result: "completed", ...summary }));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
