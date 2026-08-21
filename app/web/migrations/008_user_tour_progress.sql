-- TASK-UI-005: per-user guided tour progress (Joyride).
-- Additive only. Anonymous progress stays in localStorage sv_tour_progress.

CREATE TABLE IF NOT EXISTS user_tour_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tour_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, tour_id)
);

ALTER TABLE user_tour_progress DROP CONSTRAINT IF EXISTS user_tour_progress_status_check;
ALTER TABLE user_tour_progress
  ADD CONSTRAINT user_tour_progress_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed'));

CREATE INDEX IF NOT EXISTS user_tour_progress_user_updated_idx
  ON user_tour_progress (user_id, updated_at DESC);
