-- Additive identity, outbox lease, payment event ledger, checkout idempotency,
-- wishlist, and private object storage. Do not rewrite 001–003.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verified_at BIGINT,
  ADD COLUMN IF NOT EXISTS email_verify_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verify_expires_at BIGINT,
  ADD COLUMN IF NOT EXISTS password_reset_token TEXT,
  ADD COLUMN IF NOT EXISTS password_reset_expires_at BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_verify_token_uq
  ON users(email_verify_token) WHERE email_verify_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_password_reset_token_uq
  ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

ALTER TABLE order_comms_outbox
  ADD COLUMN IF NOT EXISTS leased_until BIGINT,
  ADD COLUMN IF NOT EXISTS lease_owner TEXT;

CREATE INDEX IF NOT EXISTS order_comms_outbox_lease_idx
  ON order_comms_outbox(status, available_at, leased_until);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  provider_event_id TEXT NOT NULL,
  order_id TEXT,
  payload_hash TEXT,
  created_at BIGINT NOT NULL,
  UNIQUE (provider, provider_event_id)
);

CREATE INDEX IF NOT EXISTS payment_events_order_idx
  ON payment_events(order_id, created_at DESC);

CREATE TABLE IF NOT EXISTS checkout_idempotency (
  key TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS checkout_idempotency_user_idx
  ON checkout_idempotency(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS stored_objects (
  key TEXT PRIMARY KEY,
  content_type TEXT NOT NULL,
  byte_length INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  owner_id TEXT,
  body BYTEA NOT NULL,
  created_at BIGINT NOT NULL
);
