-- Payment provider columns for Stripe + PayPal sandbox checkout (TASK-PAYMENTS-001).
-- Additive only. Keeps stripe_session_id from 001_initial_schema.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS orders_paypal_order_id_uq
  ON orders(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
