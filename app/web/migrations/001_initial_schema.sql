-- Canonical Wave 1 schema for SachViet (Postgres).
-- Applied via migrations/registry.mjs id 001_initial_schema.
-- Timestamps are epoch milliseconds (BIGINT). Booleans stay as INTEGER 0/1 for app compatibility.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  legacy_wp_user_id TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS users_legacy_wp_user_id_uq
  ON users(legacy_wp_user_id) WHERE legacy_wp_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  email TEXT NOT NULL,
  client_key TEXT NOT NULL,
  failures INTEGER NOT NULL,
  window_started_at BIGINT NOT NULL,
  locked_until BIGINT NOT NULL,
  PRIMARY KEY (email, client_key)
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  primary_offer_policy TEXT NOT NULL DEFAULT 'lowest_price' CHECK (primary_offer_policy = 'lowest_price'),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_media (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  attributes_json TEXT NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_offers (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  variant_id TEXT REFERENCES product_variants(id),
  vendor_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency = 'USD'),
  price_usd TEXT NOT NULL,
  list_price_usd TEXT,
  stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
  is_active INTEGER NOT NULL CHECK (is_active IN (0, 1)),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS vendor_offers_product_eligibility_idx
  ON vendor_offers(product_id, is_active, stock_quantity, vendor_id);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending_payment', 'paid', 'payment_failed')),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  subtotal_usd TEXT NOT NULL,
  checkout_url TEXT,
  stripe_session_id TEXT UNIQUE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,
  legacy_wp_order_id TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_legacy_wp_order_id_uq
  ON orders(legacy_wp_order_id) WHERE legacy_wp_order_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id),
  product_id TEXT NOT NULL,
  vendor_offer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  unit_price_usd TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  plastic_cover INTEGER NOT NULL CHECK (plastic_cover IN (0, 1)),
  gift_wrap INTEGER NOT NULL CHECK (gift_wrap IN (0, 1)),
  legacy_wp_order_item_id TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS order_items_legacy_wp_order_item_id_uq
  ON order_items(legacy_wp_order_item_id) WHERE legacy_wp_order_item_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS vendor_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  vendor_id TEXT NOT NULL,
  amount_usd TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS payouts_vendor_created_idx
  ON payouts(vendor_id, created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS payout_items (
  id TEXT PRIMARY KEY,
  payout_id TEXT NOT NULL REFERENCES payouts(id),
  order_item_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS goods_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body TEXT NOT NULL,
  verified_purchase INTEGER NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS home_sections (
  id TEXT PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_enabled INTEGER NOT NULL CHECK (is_enabled IN (0, 1)),
  updated_by TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS home_sections_sort_idx
  ON home_sections(sort_order ASC, section_key ASC);

CREATE TABLE IF NOT EXISTS notification_event_types (
  key TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  deeplink_path TEXT NOT NULL,
  is_read INTEGER NOT NULL CHECK (is_read IN (0, 1)),
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON notifications(user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  in_app_enabled INTEGER NOT NULL CHECK (in_app_enabled IN (0, 1)),
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, event_type)
);

CREATE TABLE IF NOT EXISTS vendor_notification_preferences (
  vendor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  in_app_enabled INTEGER NOT NULL CHECK (in_app_enabled IN (0, 1)),
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (vendor_id, event_type)
);

CREATE TABLE IF NOT EXISTS user_channels (
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  is_enabled INTEGER NOT NULL CHECK (is_enabled IN (0, 1)),
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, channel)
);

CREATE TABLE IF NOT EXISTS user_channel_endpoints (
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo')),
  endpoint TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, channel)
);

CREATE TABLE IF NOT EXISTS order_comms_outbox (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('order.paid')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'abandoned')),
  attempts INTEGER NOT NULL CHECK (attempts >= 0),
  available_at BIGINT NOT NULL,
  last_error TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS order_comms_outbox_order_kind_uq
  ON order_comms_outbox(order_id, kind);

CREATE INDEX IF NOT EXISTS order_comms_outbox_ready_idx
  ON order_comms_outbox(status, available_at);

CREATE TABLE IF NOT EXISTS notification_delivery_attempts (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo')),
  outcome TEXT NOT NULL CHECK (outcome IN ('recorded', 'sent', 'skipped', 'failed')),
  reason TEXT,
  recipient_hash TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS notification_delivery_attempts_notification_idx
  ON notification_delivery_attempts(notification_id, created_at DESC);

CREATE TABLE IF NOT EXISTS search_logs (
  id TEXT PRIMARY KEY,
  query_normalized TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  backend_mode TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS search_logs_query_idx
  ON search_logs(query_normalized, created_at);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS organization_members (
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL UNIQUE,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS selection_lists (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS selection_list_items (
  id TEXT PRIMARY KEY,
  selection_list_id TEXT NOT NULL REFERENCES selection_lists(id),
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS b2b_quotes (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  selection_list_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'negotiating', 'won', 'lost')),
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS b2b_quotes_status_idx
  ON b2b_quotes(status, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS b2b_quotes_org_idx
  ON b2b_quotes(organization_id, updated_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS b2b_quote_items (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES b2b_quotes(id),
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_usd TEXT
);

CREATE TABLE IF NOT EXISTS b2b_orders (
  id TEXT PRIMARY KEY,
  quote_id TEXT NOT NULL UNIQUE,
  organization_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('awaiting_po', 'confirmed', 'cancelled')),
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  subtotal_usd TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS b2b_orders_org_idx
  ON b2b_orders(organization_id, updated_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS b2b_orders_status_idx
  ON b2b_orders(status, updated_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS b2b_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES b2b_orders(id),
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  unit_price_usd TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS b2b_artifacts (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES b2b_orders(id),
  kind TEXT NOT NULL CHECK (kind IN ('contract', 'purchase_order')),
  reference_number TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS b2b_artifacts_order_idx
  ON b2b_artifacts(order_id, kind, created_at ASC);

CREATE TABLE IF NOT EXISTS institution_budgets (
  organization_id TEXT PRIMARY KEY,
  amount_usd TEXT NOT NULL,
  currency TEXT NOT NULL CHECK (currency = 'USD'),
  updated_by TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS institution_marc_records (
  product_id TEXT PRIMARY KEY,
  storage_key TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS author_manuscript_requests (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'withdrawn')),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS author_manuscript_requests_author_updated_idx
  ON author_manuscript_requests(author_id, updated_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS author_manuscript_request_logs (
  id TEXT PRIMARY KEY,
  manuscript_request_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'withdrawn')),
  actor_id TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS author_manuscript_request_logs_request_created_idx
  ON author_manuscript_request_logs(manuscript_request_id, created_at ASC, id ASC);

CREATE TABLE IF NOT EXISTS royalty_decision_acceptances (
  decision_area TEXT PRIMARY KEY,
  accepted_at BIGINT NOT NULL,
  authority_source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS publishing_requests (
  id TEXT PRIMARY KEY,
  publisher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  storage_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'withdrawn')),
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS publishing_requests_publisher_updated_idx
  ON publishing_requests(publisher_id, updated_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS publisher_marc_records (
  publisher_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (publisher_id, product_id)
);

CREATE INDEX IF NOT EXISTS publisher_marc_publisher_updated_idx
  ON publisher_marc_records(publisher_id, updated_at DESC, product_id ASC);

CREATE TABLE IF NOT EXISTS wordpress_import_runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('dry_run', 'apply')),
  accepted_count INTEGER NOT NULL,
  skipped_count INTEGER NOT NULL,
  unmatched_count INTEGER NOT NULL,
  rejected_count INTEGER NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS wordpress_import_outcomes (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES wordpress_import_runs(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'order')),
  legacy_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('accepted', 'skipped_duplicate', 'unmatched', 'rejected')),
  reason TEXT,
  created_at BIGINT NOT NULL
);
