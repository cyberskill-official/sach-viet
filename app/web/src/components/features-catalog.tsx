"use client";

import Link from "next/link";
import { featureCatalog, featuresByCategory, featureTitle, featureDescription } from "@/lib/features-catalog.mjs";
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
      <header className="sticky top-0 z-30 border-b border-border bg-panel/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-accent-strong font-bold text-white">SV</span>
            <strong className="text-lg">{t("common.brand")}</strong>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link className="cs-button cs-button--ghost" href="/">{t("nav.home")}</Link>
            <TourLauncher tourId="tour.features" />
            <button type="button" className="cs-button cs-button--ghost" onClick={() => setLocale(locale === "en" ? "vi" : "en")}>
              {locale === "en" ? "VI" : "EN"}
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <p className="cs-eyebrow text-accent-strong">{t("features.eyebrow")}</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight">{t("features.title")}</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">{t("features.intro")}</p>
        <div className="mt-4 flex flex-wrap gap-2" data-tour="features-availability">
          {(["available", "restricted", "upcoming"] as const).map((status) => (
            <span key={status} className="cs-badge">{t(availabilityKeys[status])}</span>
          ))}
        </div>

        <div className="mt-12 space-y-12" data-tour="features-categories">
          {[...groups.entries()].map(([category, features]) => (
            <section key={category}>
              <h2 className="text-2xl font-bold">{t(categoryKeys[category] || category)}</h2>
              <ul className="mt-6 grid gap-6 sm:grid-cols-2">
                {features.map((feature) => (
                  <li key={feature.id} className="cs-surface-standard rounded-2xl p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold">{featureTitle(locale, feature)}</h3>
                      <span className="cs-badge">{t(availabilityKeys[feature.availability] || feature.availability)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted">{featureDescription(locale, feature)}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {feature.availability === "available" ? (
                        <Link className="cs-button" href={feature.href}>{t("features.ctaOpen")}</Link>
                      ) : (
                        <span className="cs-button cs-button--ghost pointer-events-none opacity-60">{t("features.ctaLearn")}</span>
                      )}
                      {feature.tourId ? <TourLauncher tourId={feature.tourId} className="cs-button cs-button--secondary" /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-16">
          <Link className="cs-button" href="/">{t("features.footerCta")}</Link>
        </p>
      </section>
    </main>
  );
}
