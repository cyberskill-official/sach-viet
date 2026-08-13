-- Wave 3: Postgres FTS/trigram, ticket assignee, fulfillment overlay,
-- customer locale + stored addresses. Additive only. Do not rewrite 001–005.
-- pg_trgm is created in public by registry.mjs so isolated test schemas can
-- see gin_trgm_ops.

-- Fold Vietnamese (and ASCII) into a stable search key. IMMUTABLE so it can
-- back generated columns. The function body must not contain semicolons because
-- the migrator splits statements on that character.
CREATE OR REPLACE FUNCTION sachviet_normalize_search(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT trim(both ' ' FROM regexp_replace(
    lower(translate(
      replace(replace(coalesce(input, ''), 'đ', 'd'), 'Đ', 'd'),
      'áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴ',
      'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyyaaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyy'
    )),
    '[^a-z0-9]+',
    ' ',
    'g'
  ))
$$;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_text TEXT
  GENERATED ALWAYS AS (
    sachviet_normalize_search(
      coalesce(title, '') || ' ' || coalesce(slug, '') || ' ' || coalesce(description, '')
    )
  ) STORED;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple',
      sachviet_normalize_search(
        coalesce(title, '') || ' ' || coalesce(slug, '') || ' ' || coalesce(description, '')
      )
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS products_search_tsv_idx ON products USING GIN (search_tsv);

ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS assignee_id TEXT;

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_status TEXT;
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_fulfillment_status_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_fulfillment_status_check
  CHECK (fulfillment_status IS NULL OR fulfillment_status IN ('packing', 'shipped', 'delivered'));

ALTER TABLE users ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'vi';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_locale_check;
ALTER TABLE users ADD CONSTRAINT users_locale_check CHECK (locale IN ('vi', 'en'));

CREATE TABLE IF NOT EXISTS user_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  label TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  region TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'US',
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS user_addresses_user_idx
  ON user_addresses(user_id, created_at DESC, id DESC);
