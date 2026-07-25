-- Admin-only BYOK AI settings (singleton row id = 'default').
-- API keys are stored encrypted in api_key_ciphertext (never plaintext).

CREATE TABLE IF NOT EXISTS ai_settings (
  id TEXT PRIMARY KEY,
  base_url TEXT NOT NULL,
  model TEXT NOT NULL,
  api_key_ciphertext TEXT,
  updated_at BIGINT NOT NULL,
  updated_by TEXT
);
