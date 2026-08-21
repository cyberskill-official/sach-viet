"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export function ForbiddenPanel() {
  const { t } = useLocale();
  return (
    <section className="cs-surface-heavy w-full rounded-2xl p-7">
      <p className="cs-eyebrow text-accent-strong">{t("common.brand")}</p>
      <h1 className="mt-3 text-3xl font-extrabold">{t("auth.accessDenied")}</h1>
      <p className="mt-2 text-muted">{t("auth.accessDeniedBody")}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="cs-button" href="/">{t("auth.backToStorefront")}</Link>
        <Link className="cs-button cs-button--secondary" href="/login">{t("nav.login")}</Link>
      </div>
    </section>
  );
}
