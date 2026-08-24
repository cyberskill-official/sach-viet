"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { driver, type Driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useLocale } from "@/components/locale-provider";
import {
  driverStepsFor,
  isTerminalTourStatus,
  pathForTourId,
  resolveTourIdForPath,
  shouldAutoStartTour,
  TOUR_IDS,
} from "@/lib/tours/registry.mjs";
import {
  mergeTourProgress,
  patchLocalTourStatus,
  readLocalTourProgress,
  writeLocalTourProgress,
} from "@/lib/tours/progress.mjs";

type TourContextValue = {
  startTour: (tourId: string) => void;
  restartTour: (tourId: string) => void;
  skipTour: () => void;
  progress: Record<string, { status: string; updatedAt: number }>;
  activeTourId: string | null;
};

type TourOutcome = "completed" | "dismissed";

const TourContext = createContext<TourContextValue>({
  startTour: () => {},
  restartTour: () => {},
  skipTour: () => {},
  progress: {},
  activeTourId: null,
});

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForDriverSteps(id: string, locale: string, attempts = 12, delayMs = 120) {
  for (let i = 0; i < attempts; i += 1) {
    const steps = driverStepsFor(id, locale);
    if (steps.length) return steps;
    await sleep(delayMs);
  }
  return driverStepsFor(id, locale);
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [progress, setProgress] = useState(() => readLocalTourProgress());
  const [tourId, setTourId] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const progressRef = useRef(progress);
  const autoStartedRef = useRef<Set<string>>(new Set());
  const queryTourHandledRef = useRef<string | null>(null);
  const driverRef = useRef<Driver | null>(null);
  const tourIdRef = useRef<string | null>(null);
  const outcomeRef = useRef<TourOutcome | null>(null);
  /** When true, onDestroyed skips progress write (restart / unmount teardown). */
  const skipPersistOnDestroyRef = useRef(false);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    tourIdRef.current = tourId;
  }, [tourId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me");
        if (!me.ok) return;
        const meBody = await me.json().catch(() => null);
        if (!meBody?.user) return;
        if (cancelled) return;
        setAuthenticated(true);
        const local = readLocalTourProgress();
        const response = await fetch("/api/account/tours");
        if (!response.ok) return;
        const body = await response.json();
        const server = body.tours || {};
        const merged = mergeTourProgress(local, server);
        writeLocalTourProgress(merged);
        if (!cancelled) setProgress(merged);
        await fetch("/api/account/tours", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merge: local }),
        });
      } catch { /* anonymous ok */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const persistStatus = useCallback(async (id: string, status: string) => {
    const next = patchLocalTourStatus(id, status);
    setProgress(next);
    if (!authenticated) return;
    try {
      await fetch("/api/account/tours", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId: id, status }),
      });
    } catch { /* offline ok */ }
  }, [authenticated]);

  const destroyActiveDriver = useCallback((opts?: { skipPersist?: boolean; outcome?: TourOutcome }) => {
    if (opts?.skipPersist) skipPersistOnDestroyRef.current = true;
    if (opts?.outcome) outcomeRef.current = opts.outcome;
    const active = driverRef.current;
    if (active) {
      active.destroy();
      driverRef.current = null;
    } else {
      skipPersistOnDestroyRef.current = false;
      outcomeRef.current = null;
    }
  }, []);

  const launchDriver = useCallback((id: string, steps = driverStepsFor(id, locale)) => {
    if (!steps.length) return false;

    destroyActiveDriver({ skipPersist: true });

    outcomeRef.current = null;
    skipPersistOnDestroyRef.current = false;
    tourIdRef.current = id;
    setTourId(id);

    const reduced = prefersReducedMotion();
    const instance = driver({
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      allowClose: true,
      overlayClickBehavior: "close",
      stagePadding: 10,
      stageRadius: 12,
      smoothScroll: !reduced,
      animate: !reduced,
      popoverClass: "sv-driver-popover",
      nextBtnText: t("tours.next"),
      prevBtnText: t("tours.back"),
      doneBtnText: t("tours.last"),
      steps,
      onCloseClick: (_element, _step, { driver: d }) => {
        outcomeRef.current = "dismissed";
        d.destroy();
      },
      onDoneClick: (_element, _step, { driver: d }) => {
        outcomeRef.current = "completed";
        d.destroy();
      },
      onDestroyed: () => {
        const activeId = tourIdRef.current;
        const skipPersist = skipPersistOnDestroyRef.current;
        const outcome = outcomeRef.current ?? "dismissed";
        skipPersistOnDestroyRef.current = false;
        outcomeRef.current = null;
        driverRef.current = null;
        tourIdRef.current = null;
        setTourId(null);
        if (!skipPersist && activeId) {
          void persistStatus(activeId, outcome);
        }
      },
    });

    driverRef.current = instance;
    instance.drive();
    void persistStatus(id, "in_progress");
    return true;
  }, [destroyActiveDriver, locale, persistStatus, t]);

  const startTour = useCallback(async (id: string) => {
    if (!TOUR_IDS.includes(id)) return;
    destroyActiveDriver({ skipPersist: true });
    const steps = await waitForDriverSteps(id, locale);
    if (!steps.length) {
      const targetPath = pathForTourId(id);
      const here = typeof window !== "undefined" ? window.location.pathname : pathname || "";
      if (targetPath && targetPath !== here) {
        const url = `${targetPath}${targetPath.includes("?") ? "&" : "?"}tour=${encodeURIComponent(id)}`;
        router.push(url);
        return;
      }
      return;
    }
    launchDriver(id, steps);
  }, [destroyActiveDriver, launchDriver, locale, pathname, router]);

  const restartTour = useCallback((id: string) => {
    destroyActiveDriver({ skipPersist: true });
    void persistStatus(id, "pending").then(() => startTour(id));
  }, [destroyActiveDriver, persistStatus, startTour]);

  const skipTour = useCallback(() => {
    const id = tourIdRef.current;
    if (driverRef.current) {
      destroyActiveDriver({ outcome: "dismissed" });
    } else if (id) {
      void persistStatus(id, "dismissed");
      tourIdRef.current = null;
      setTourId(null);
    }
  }, [destroyActiveDriver, persistStatus]);

  // Deep-link / Features off-page launch: ?tour=tour.features
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("tour");
    if (!requested || !TOUR_IDS.includes(requested)) return;
    const handleKey = `${pathname}:${requested}`;
    if (queryTourHandledRef.current === handleKey) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        destroyActiveDriver({ skipPersist: true });
        const steps = await waitForDriverSteps(requested, locale);
        if (cancelled) return;
        if (!steps.length) {
          // Targets not ready yet — allow another attempt on next effect.
          return;
        }
        queryTourHandledRef.current = handleKey;
        launchDriver(requested, steps);
        params.delete("tour");
        const qs = params.toString();
        router.replace(`${pathname || "/"}${qs ? `?${qs}` : ""}`);
      })();
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [destroyActiveDriver, launchDriver, locale, pathname, router]);

  // Auto-start once per tour id when route matches and status is pending (not completed/dismissed).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tour")) return;
    const id = resolveTourIdForPath(pathname || "");
    if (!id || !shouldAutoStartTour(id)) return;
    if (autoStartedRef.current.has(id)) return;
    const status = progressRef.current[id]?.status || "pending";
    if (isTerminalTourStatus(status) || status === "in_progress") return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const steps = await waitForDriverSteps(id, locale);
        if (cancelled || !steps.length) return;
        autoStartedRef.current.add(id);
        launchDriver(id, steps);
      })();
    }, 600);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pathname, locale, launchDriver]);

  // Tear down overlay on route change / unmount so it does not leak across pages.
  // Destroy without finishing → dismissed (default outcome in onDestroyed).
  useEffect(() => {
    return () => {
      destroyActiveDriver();
    };
  }, [pathname, destroyActiveDriver]);

  const value = useMemo(
    () => ({ startTour, restartTour, skipTour, progress, activeTourId: tourId }),
    [startTour, restartTour, skipTour, progress, tourId],
  );

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}

export function TourLauncher({ tourId, className }: { tourId: string; className?: string }) {
  const { t } = useLocale();
  const { startTour, restartTour, progress, activeTourId } = useTour();
  const status = progress[tourId]?.status || "pending";
  const label = isTerminalTourStatus(status) ? t("tours.restart") : t("tours.takeTour");
  const busy = Boolean(activeTourId);
  return (
    <button
      type="button"
      className={className || "cs-button cs-button--ghost min-h-11"}
      aria-label={label}
      aria-disabled={busy || undefined}
      disabled={busy}
      data-tour="tour-launcher"
      onClick={() => (isTerminalTourStatus(status) ? restartTour(tourId) : startTour(tourId))}
    >
      {label}
    </button>
  );
}

/** Resolves the best tour for the current pathname (storefront / portal / B2C). */
export function RouteTourLauncher({ className, fallbackTourId }: { className?: string; fallbackTourId?: string }) {
  const pathname = usePathname();
  const tourId = resolveTourIdForPath(pathname || "") || fallbackTourId || "tour.storefront";
  return <TourLauncher tourId={tourId} className={className} />;
}
