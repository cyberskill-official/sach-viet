import { TOUR_IDS, TOUR_STATUSES, isTerminalTourStatus } from "./registry.mjs";

export const TOUR_STORAGE_KEY = "sv_tour_progress";

export function emptyTourProgress() {
  return Object.fromEntries(TOUR_IDS.map((id) => [id, { status: "pending", updatedAt: 0 }]));
}

export function normalizeTourStatus(value) {
  return TOUR_STATUSES.includes(value) ? value : "pending";
}

export function normalizeProgressMap(raw) {
  const base = emptyTourProgress();
  if (!raw || typeof raw !== "object") return base;
  for (const id of TOUR_IDS) {
    const entry = raw[id];
    if (!entry || typeof entry !== "object") continue;
    base[id] = {
      status: normalizeTourStatus(entry.status),
      updatedAt: Number.isFinite(Number(entry.updatedAt)) ? Number(entry.updatedAt) : 0,
    };
  }
  return base;
}

/** Prefer newer updatedAt; terminal statuses win ties when timestamps equal. */
export function mergeTourProgress(localMap, serverMap) {
  const local = normalizeProgressMap(localMap);
  const server = normalizeProgressMap(serverMap);
  const merged = emptyTourProgress();
  for (const id of TOUR_IDS) {
    const a = local[id];
    const b = server[id];
    if (a.updatedAt > b.updatedAt) merged[id] = a;
    else if (b.updatedAt > a.updatedAt) merged[id] = b;
    else if (isTerminalTourStatus(a.status) && !isTerminalTourStatus(b.status)) merged[id] = a;
    else if (isTerminalTourStatus(b.status) && !isTerminalTourStatus(a.status)) merged[id] = b;
    else merged[id] = a.status === "in_progress" ? a : b.status !== "pending" ? b : a;
  }
  return merged;
}

export function readLocalTourProgress() {
  if (typeof window === "undefined") return emptyTourProgress();
  try {
    return normalizeProgressMap(JSON.parse(window.localStorage.getItem(TOUR_STORAGE_KEY) || "{}"));
  } catch {
    return emptyTourProgress();
  }
}

export function writeLocalTourProgress(map) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(normalizeProgressMap(map)));
  } catch { /* ignore */ }
}

export function patchLocalTourStatus(tourId, status, now = Date.now()) {
  const next = readLocalTourProgress();
  if (!TOUR_IDS.includes(tourId)) return next;
  next[tourId] = { status: normalizeTourStatus(status), updatedAt: now };
  writeLocalTourProgress(next);
  return next;
}
