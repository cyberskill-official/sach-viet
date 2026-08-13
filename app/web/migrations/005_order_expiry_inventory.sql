-- Pending-order TTL + inventory movement ledger (Wave 1 stock restore).
-- Additive only. Do not rewrite 001–004.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS expires_at BIGINT;

-- Legacy pending rows (created before this migration) get the same 30-minute window
-- measured from created_at so the expire job can unlock abandoned inventory.
UPDATE orders
   SET expires_at = created_at + 1800000
 WHERE status = 'pending_payment' AND expires_at IS NULL;

CREATE INDEX IF NOT EXISTS orders_pending_expiry_idx
  ON orders(expires_at)
  WHERE status = 'pending_payment';

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  offer_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_movements_order_idx
  ON inventory_movements(order_id, created_at);

-- Identity mail shares the leased order_comms_outbox (kinds + optional payload).
ALTER TABLE order_comms_outbox DROP CONSTRAINT IF EXISTS order_comms_outbox_kind_check;
ALTER TABLE order_comms_outbox
  ADD CONSTRAINT order_comms_outbox_kind_check
  CHECK (kind IN ('order.paid', 'identity.verify', 'identity.reset'));

ALTER TABLE order_comms_outbox ADD COLUMN IF NOT EXISTS payload TEXT;
