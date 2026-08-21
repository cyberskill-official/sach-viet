import { openDatabase } from "../db.mjs";
import { TOUR_IDS } from "./registry.mjs";
import { emptyTourProgress, mergeTourProgress, normalizeProgressMap, normalizeTourStatus } from "./progress.mjs";
function requireUser(user) {
  if (!user?.id) throw new Error("A signed-in customer is required.");
  return user;
}

export async function createTourStore({ dbPath } = {}) {
  const db = await openDatabase(dbPath);
  return { db, close: () => db.close() };
}

export async function listTourProgress(store, user) {
  requireUser(user);
  const rows = await store.db
    .prepare("SELECT tour_id AS tourId, status, updated_at AS updatedAt FROM user_tour_progress WHERE user_id = ?")
    .all(user.id);
  const map = emptyTourProgress();
  for (const row of rows) {
    if (!TOUR_IDS.includes(row.tourId)) continue;
    map[row.tourId] = {
      status: normalizeTourStatus(row.status),
      updatedAt: Number(row.updatedAt) || 0,
    };
  }
  return map;
}

export async function upsertTourProgress(store, user, tourId, status, { updatedAt = Date.now() } = {}) {
  requireUser(user);
  if (!TOUR_IDS.includes(tourId)) throw new Error("Unknown tour id.");
  const normalized = normalizeTourStatus(status);
  await store.db.prepare(`
    INSERT INTO user_tour_progress (user_id, tour_id, status, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (user_id, tour_id) DO UPDATE SET status = EXCLUDED.status, updated_at = EXCLUDED.updated_at
  `).run(user.id, tourId, normalized, updatedAt);
  return { tourId, status: normalized, updatedAt };
}

export async function mergeAndPersistTourProgress(store, user, localMap) {
  requireUser(user);
  const server = await listTourProgress(store, user);
  const merged = mergeTourProgress(normalizeProgressMap(localMap), server);
  for (const tourId of TOUR_IDS) {
    const entry = merged[tourId];
    if (entry.status === "pending" && entry.updatedAt === 0) continue;
    await upsertTourProgress(store, user, tourId, entry.status, { updatedAt: entry.updatedAt || Date.now() });
  }
  return merged;
}
