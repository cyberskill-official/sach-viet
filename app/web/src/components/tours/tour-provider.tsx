"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ACTIONS, EVENTS, Joyride, STATUS } from "react-joyride";
import type { EventData } from "react-joyride";
import { useLocale } from "@/components/locale-provider";
import {
  joyrideStepsFor,
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
};

const TourContext = createContext<TourContextValue>({
  startTour: () => {},
  restartTour: () => {},
  skipTour: () => {},
  progress: {},
});

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { locale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [progress, setProgress] = useState(() => readLocalTourProgress());
  const [run, setRun] = useState(false);
  const [tourId, setTourId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const progressRef = useRef(progress);
  const autoStartedRef = useRef<Set<string>>(new Set());
  const queryTourHandledRef = useRef<string | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetch("/api/auth/me");
        if (!me.ok) return;
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

  const startTour = useCallback((id: string) => {
    if (!TOUR_IDS.includes(id)) return;
    const steps = joyrideStepsFor(id, locale);
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
    setTourId(id);
    setStepIndex(0);
    setRun(true);
    void persistStatus(id, "in_progress");
  }, [locale, pathname, persistStatus, router]);

  const restartTour = useCallback((id: string) => {
    void persistStatus(id, "pending").then(() => startTour(id));
  }, [persistStatus, startTour]);

  const skipTour = useCallback(() => {
    if (tourId) void persistStatus(tourId, "dismissed");
    setRun(false);
    setTourId(null);
  }, [persistStatus, tourId]);

  // Deep-link / Features off-page launch: ?tour=tour.features
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("tour");
    if (!requested || !TOUR_IDS.includes(requested)) return;
    if (queryTourHandledRef.current === `${pathname}:${requested}`) return;
    queryTourHandledRef.current = `${pathname}:${requested}`;
    const timer = window.setTimeout(() => {
      startTour(requested);
      params.delete("tour");
      const qs = params.toString();
      router.replace(`${pathname || "/"}${qs ? `?${qs}` : ""}`);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pathname, router, startTour]);

  // Auto-start once per tour id when route matches and status is pending (not completed/dismissed).
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tour")) return;
    const id = resolveTourIdForPath(pathname || "");
    if (!id || !shouldAutoStartTour(id)) return;
    if (autoStartedRef.current.has(id)) return;
    const status = progressRef.current[id]?.status || "pending";
    if (isTerminalTourStatus(status) || status === "in_progress") return;
    const timer = window.setTimeout(() => {
      const steps = joyrideStepsFor(id, locale);
      if (!steps.length) return;
      autoStartedRef.current.add(id);
      setTourId(id);
      setStepIndex(0);
      setRun(true);
      void persistStatus(id, "in_progress");
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pathname, locale, persistStatus]);

  const steps = useMemo(() => (tourId ? joyrideStepsFor(tourId, locale) : []), [tourId, locale]);

  const handleEvent = useCallback((data: EventData) => {
    const { status, action, type, index } = data;
    if (action === ACTIONS.CLOSE || action === ACTIONS.SKIP || status === STATUS.SKIPPED) {
      if (tourId) void persistStatus(tourId, "dismissed");
      setRun(false);
      setTourId(null);
      return;
    }
    if (status === STATUS.FINISHED && tourId) {
      void persistStatus(tourId, "completed");
      setRun(false);
      setTourId(null);
      return;
    }
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  }, [persistStatus, tourId]);

  const value = useMemo(() => ({ startTour, restartTour, skipTour, progress }), [startTour, restartTour, skipTour, progress]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <Joyride
        steps={steps}
        run={run && steps.length > 0}
        stepIndex={stepIndex}
        continuous
        scrollToFirstStep
        onEvent={handleEvent}
        locale={{
          back: t("tours.back"),
          close: t("tours.close"),
          last: t("tours.last"),
          next: t("tours.next"),
          skip: t("tours.skip"),
        }}
        options={{
          buttons: ["back", "close", "primary", "skip"],
          overlayClickAction: "close",
          skipScroll: prefersReducedMotion(),
          skipBeacon: true,
          // Keep page usable: do not trap focus behind the spotlight overlay.
          disableFocusTrap: true,
          primaryColor: "var(--cs-accent, #0e7490)",
          zIndex: 10000,
        }}
      />
    </TourContext.Provider>
  );
}

export function useTour() {
  return useContext(TourContext);
}

export function TourLauncher({ tourId, className }: { tourId: string; className?: string }) {
  const { t } = useLocale();
  const { startTour, restartTour, progress } = useTour();
  const status = progress[tourId]?.status || "pending";
  const label = isTerminalTourStatus(status) ? t("tours.restart") : t("tours.takeTour");
  return (
    <button
      type="button"
      className={className || "cs-button cs-button--ghost"}
      aria-label={label}
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
