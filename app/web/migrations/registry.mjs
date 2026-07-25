/**
 * Ordered schema migrations. Add new entries at the end; never reorder or
 * rewrite an already-shipped `id`. Keep each `up` additive and STRICT-friendly.
 *
 * Follow-up (not in this foundation): move dual-owned CREATE TABLE definitions
 * (orders, notifications, royalty_decision_acceptances) into numbered migrations
 * and thin the per-module ensureSchema helpers.
 */

export const MIGRATIONS = Object.freeze([
  {
    id: "001_user_channel_endpoints",
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_channel_endpoints (
          user_id TEXT NOT NULL,
          channel TEXT NOT NULL CHECK (channel IN ('email', 'zalo')),
          endpoint TEXT NOT NULL,
          updated_at INTEGER NOT NULL,
          PRIMARY KEY (user_id, channel)
        ) STRICT;
      `);
    },
  },
]);
