import Link from "next/link";
import { LuxuryShell } from "@/components/luxury-shell";

export const metadata = {
  title: "Supplier portal retired · Sách Việt",
  robots: { index: false, follow: false },
};

export default function SupplierRetiredPage() {
  return (
    <LuxuryShell width="2xl">
      <section className="relative overflow-hidden rounded-[2rem] sv-lux-hero-glow border border-border/60 px-6 py-16 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--sv-lux-gold)_16%,transparent),transparent_55%)]" />
        <div className="relative">
          <p className="sv-lux-eyebrow">Portal retired</p>
          <h1 className="sv-font-display mt-3 text-4xl tracking-tight">Supplier portal is no longer available</h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            Partner supply workflows moved off this surface. Use the Features catalog for current platform capabilities,
            or sign in to the portal that matches your role.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="cs-button min-h-11" href="/features">
              See platform status
            </Link>
            <Link className="cs-button cs-button--secondary min-h-11" href="/">
              Back to storefront
            </Link>
          </div>
        </div>
      </section>
    </LuxuryShell>
  );
}
