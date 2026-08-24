"use client";

import Link from "next/link";
import { ArrowRight, Crown, Gift, Sparkle, UsersThree } from "@phosphor-icons/react";
import { useLocale } from "@/components/locale-provider";
import { MotionReveal } from "@/components/motion-reveal";
import { LuxuryShell } from "@/components/luxury-shell";

const perks = [
  { icon: Sparkle, titleKey: "membership.perkEarlyTitle", bodyKey: "membership.perkEarlyBody" },
  { icon: Gift, titleKey: "membership.perkEditionsTitle", bodyKey: "membership.perkEditionsBody" },
  { icon: UsersThree, titleKey: "membership.perkCommunityTitle", bodyKey: "membership.perkCommunityBody" },
] as const;

export function MembershipPanel() {
  const { t } = useLocale();

  return (
    <LuxuryShell width="7xl">
      <section className="relative overflow-hidden rounded-[2rem] sv-lux-hero-glow border border-border/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--sv-lux-gold)_14%,transparent),transparent_62%)]" />
        <div className="relative px-6 py-14 text-center sm:px-12 sm:py-20">
          <MotionReveal>
            <Crown size={36} weight="duotone" className="mx-auto text-[var(--sv-lux-gold)]" aria-hidden="true" />
            <p className="sv-lux-eyebrow mt-6">{t("storefront.membershipEyebrow")}</p>
            <h1 className="sv-font-display mt-4 text-4xl tracking-tight sm:text-5xl">{t("membership.title")}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">{t("membership.intro")}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                className="cs-button inline-flex min-h-11 items-center gap-2 px-6"
                href="/register?from=circle"
                aria-label={t("membership.registerCta")}
              >
                {t("membership.registerCta")}
                <ArrowRight size={16} weight="bold" aria-hidden="true" />
              </Link>
              <Link className="cs-button cs-button--secondary min-h-11 px-6" href="/login?redirect=/membership" aria-label={t("membership.loginCta")}>
                {t("membership.loginCta")}
              </Link>
            </div>
          </MotionReveal>
        </div>
      </section>

      <section className="mt-14 sm:mt-16" aria-labelledby="membership-perks-heading">
        <MotionReveal>
          <p className="sv-lux-eyebrow">{t("membership.perksEyebrow")}</p>
          <h2 id="membership-perks-heading" className="sv-font-display mt-3 text-3xl tracking-tight">{t("membership.perksTitle")}</h2>
        </MotionReveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {perks.map(({ icon: Icon, titleKey, bodyKey }, index) => (
            <MotionReveal key={titleKey} delayMs={index * 70} className="sv-glass-card rounded-2xl p-6">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--sv-lux-gold)_14%,transparent)] text-[var(--sv-lux-gold-strong)]" aria-hidden="true">
                <Icon size={22} weight="duotone" />
              </span>
              <h3 className="sv-font-display mt-5 text-xl">{t(titleKey)}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{t(bodyKey)}</p>
            </MotionReveal>
          ))}
        </div>
      </section>

      <section className="sv-glass-heavy mt-14 rounded-[2rem] px-6 py-10 text-center sm:px-12 sm:py-14">
        <h2 className="sv-font-display text-2xl sm:text-3xl">{t("membership.footerTitle")}</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted">{t("membership.footerBody")}</p>
        <Link className="cs-button mt-6 inline-flex min-h-11 items-center gap-2 px-6" href="/">
          {t("membership.browseBooks")}
          <ArrowRight size={16} weight="bold" aria-hidden="true" />
        </Link>
      </section>
    </LuxuryShell>
  );
}
