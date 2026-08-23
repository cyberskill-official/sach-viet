"use client";

import Link from "next/link";
import { featureCatalog, featuresByCategory, featureTitle, featureDescription } from "@/lib/features-catalog.mjs";
import { TOUR_IDS, tourTitleKey } from "@/lib/tours/registry.mjs";
import { useLocale } from "@/components/locale-provider";
import { TourLauncher } from "@/components/tours/tour-provider";
import { MotionReveal } from "@/components/motion-reveal";

type FeatureItem = (typeof featureCatalog)[number];

const categoryKeys: Record<string, string> = {
  commerce: "features.categoryCommerce",
  account: "features.categoryAccount",
  portals: "features.categoryPortals",
  finance: "features.categoryFinance",
  platform: "features.categoryPlatform",
};

const availabilityKeys: Record<string, string> = {
  available: "features.available",
  restricted: "features.restricted",
  upcoming: "features.upcoming",
};

export function FeaturesCatalog() {
  const { locale, setLocale, t } = useLocale();
  const groups = featuresByCategory() as Map<string, FeatureItem[]>;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-[color-mix(in_oklab,var(--cs-color-surface-panel)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cs-color-accent-ochre,#f4ba17)]">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--cs-accent-strong)] to-[var(--cs-accent)] font-bold text-white" aria-hidden="true">SV</span>
            <strong className="truncate text-lg">{t("common.brand")}</strong>
          </Link>
          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link className="cs-button cs-button--ghost" href="/">{t("nav.home")}</Link>
            <TourLauncher tourId="tour.features" />
            <button type="button" className="cs-button cs-button--ghost" aria-label={t("common.language")} onClick={() => setLocale(locale === "en" ? "vi" : "en")}>
              {locale === "en" ? "VI" : "EN"}
            </button>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--cs-accent)_20%,transparent),transparent_55%)]" />
        <div className="cs-aurora-wash sv-aurora-live pointer-events-none absolute inset-0 opacity-30" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="cs-eyebrow sv-motion-fade-up text-accent-strong">{t("features.eyebrow")}</p>
          <h1 className="sv-motion-fade-up sv-motion-delay-1 mt-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl lg:text-5xl">{t("features.title")}</h1>
          <p className="sv-motion-fade-up sv-motion-delay-2 mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">{t("features.intro")}</p>
          <ul className="mt-5 flex flex-wrap gap-2" data-tour="features-availability" aria-label={t("features.eyebrow")}>
            {(["available", "restricted", "upcoming"] as const).map((status) => (
              <li key={status}>
                <span className="cs-badge" data-availability={status}>{t(availabilityKeys[status])}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="space-y-12" data-tour="features-categories">
          {[...groups.entries()].map(([category, features]) => (
            <section key={category} className="scroll-mt-28">
              <h2 className="text-xl font-bold sm:text-2xl">{t(categoryKeys[category] || category)}</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {features.map((feature, index) => (
                  <MotionReveal key={feature.id} as="li" delayMs={Math.min(index, 6) * 60} className="cs-surface-standard sv-card-lift flex h-full flex-col rounded-2xl p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold sm:text-xl">{featureTitle(locale, feature)}</h3>
                      <span className="cs-badge" data-availability={feature.availability}>{t(availabilityKeys[feature.availability] || feature.availability)}</span>
                    </div>
                    <p className="mt-3 flex-1 text-sm leading-6 text-muted">{featureDescription(locale, feature)}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {feature.availability === "available" ? (
                        <Link className="cs-button" href={feature.href}>{t("features.ctaOpen")}</Link>
                      ) : (
                        <span className="cs-button cs-button--ghost pointer-events-none opacity-60" aria-disabled="true">{t("features.ctaLearn")}</span>
                      )}
                      {feature.tourId ? <TourLauncher tourId={feature.tourId} className="cs-button cs-button--secondary" /> : null}
                    </div>
                  </MotionReveal>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-16 scroll-mt-28" data-tour="features-tour-index">
          <h2 className="text-xl font-bold sm:text-2xl">{t("tours.indexTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{t("tours.indexIntro")}</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOUR_IDS.map((tourId, index) => (
              <li key={tourId} className="cs-surface-standard flex min-h-[4.5rem] flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mt-1 block font-medium leading-snug">{t(tourTitleKey(tourId))}</span>
                </span>
                <TourLauncher tourId={tourId} className="cs-button cs-button--secondary shrink-0" />
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-16">
          <Link className="cs-button" href="/">{t("features.footerCta")}</Link>
        </p>
      </section>
    </main>
  );
}
