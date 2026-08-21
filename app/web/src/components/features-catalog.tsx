"use client";

import Link from "next/link";
import { featureCatalog, featuresByCategory, featureTitle, featureDescription } from "@/lib/features-catalog.mjs";
import { TOUR_IDS, tourTitleKey } from "@/lib/tours/registry.mjs";
import { useLocale } from "@/components/locale-provider";
import { TourLauncher } from "@/components/tours/tour-provider";

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
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--cs-accent-strong)] to-[var(--cs-accent)] font-bold text-white">SV</span>
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
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="cs-eyebrow text-accent-strong">{t("features.eyebrow")}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{t("features.title")}</h1>
        <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{t("features.intro")}</p>
        <div className="mt-4 flex flex-wrap gap-2" data-tour="features-availability">
          {(["available", "restricted", "upcoming"] as const).map((status) => (
            <span key={status} className="cs-badge">{t(availabilityKeys[status])}</span>
          ))}
        </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="space-y-12" data-tour="features-categories">
          {[...groups.entries()].map(([category, features]) => (
            <section key={category}>
              <h2 className="text-xl font-bold sm:text-2xl">{t(categoryKeys[category] || category)}</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature.id} className="cs-surface-standard rounded-2xl p-5 sm:p-6 transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_color-mix(in_oklab,var(--cs-accent)_14%,transparent)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold sm:text-xl">{featureTitle(locale, feature)}</h3>
                      <span className="cs-badge">{t(availabilityKeys[feature.availability] || feature.availability)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">{featureDescription(locale, feature)}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {feature.availability === "available" ? (
                        <Link className="cs-button" href={feature.href}>{t("features.ctaOpen")}</Link>
                      ) : (
                        <span className="cs-button cs-button--ghost pointer-events-none opacity-60" aria-disabled="true">{t("features.ctaLearn")}</span>
                      )}
                      {feature.tourId ? <TourLauncher tourId={feature.tourId} className="cs-button cs-button--secondary" /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-16" data-tour="features-tour-index">
          <h2 className="text-xl font-bold sm:text-2xl">{t("tours.indexTitle")}</h2>
          <p className="mt-3 max-w-2xl text-sm text-muted">{t("tours.indexIntro")}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TOUR_IDS.map((tourId) => (
              <li key={tourId} className="cs-surface-standard flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
                <span className="min-w-0 font-medium">{t(tourTitleKey(tourId))}</span>
                <TourLauncher tourId={tourId} className="cs-button cs-button--secondary shrink-0" />
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-16">
          <Link className="cs-button" href="/">{t("features.footerCta")}</Link>
        </p>
      </section>
    </main>
  );
}
