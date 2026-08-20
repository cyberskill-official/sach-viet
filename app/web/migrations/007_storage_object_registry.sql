-- PKG-08 / TASK-PLT-002: expand stored_objects metadata for a future private
-- Supabase Storage backend. Active writes remain postgres BYTEA (body NOT NULL).
-- Do not enable Supabase Storage as default without the dedicated package.
-- Avoid DO dollar-blocks — migrate runner splits statements on semicolons.

ALTER TABLE stored_objects
  ADD COLUMN IF NOT EXISTS backend TEXT NOT NULL DEFAULT 'postgres';

ALTER TABLE stored_objects
  ADD COLUMN IF NOT EXISTS external_path TEXT;

ALTER TABLE stored_objects
  ADD COLUMN IF NOT EXISTS scan_status TEXT NOT NULL DEFAULT 'unscanned';

ALTER TABLE stored_objects
  ADD COLUMN IF NOT EXISTS scanned_at BIGINT;

ALTER TABLE stored_objects
  ADD COLUMN IF NOT EXISTS quarantine_reason TEXT;

ALTER TABLE stored_objects DROP CONSTRAINT IF EXISTS stored_objects_backend_check;
ALTER TABLE stored_objects
  ADD CONSTRAINT stored_objects_backend_check
  CHECK (backend IN ('postgres', 'supabase'));

ALTER TABLE stored_objects DROP CONSTRAINT IF EXISTS stored_objects_scan_status_check;
ALTER TABLE stored_objects
  ADD CONSTRAINT stored_objects_scan_status_check
  CHECK (scan_status IN ('unscanned', 'clean', 'quarantined', 'error'));

CREATE INDEX IF NOT EXISTS stored_objects_owner_created_idx
  ON stored_objects (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS stored_objects_scan_status_idx
  ON stored_objects (scan_status)
  WHERE scan_status <> 'clean';
