"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export function ForbiddenPanel() {
  const { t } = useLocale();
  return (
    <section className="w-full">
      <p className="sv-lux-eyebrow">{t("common.brand")}</p>
      <h1 className="sv-font-display mt-3 text-3xl tracking-tight sm:text-4xl">{t("auth.accessDenied")}</h1>
      <p className="mt-3 text-muted leading-7">{t("auth.accessDeniedBody")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="cs-button min-h-11" href="/">{t("auth.backToStorefront")}</Link>
        <Link className="cs-button cs-button--secondary min-h-11" href="/login">{t("nav.login")}</Link>
      </div>
    </section>
  );
}
