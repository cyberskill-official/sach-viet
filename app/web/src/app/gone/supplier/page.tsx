import Link from "next/link";

export const metadata = {
  title: "Supplier portal retired · Sách Việt",
  robots: { index: false, follow: false },
};

export default function SupplierRetiredPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/80 bg-[color-mix(in_oklab,var(--cs-color-surface-panel)_88%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--cs-accent-strong)] to-[var(--cs-accent)] font-bold text-white">
              SV
            </span>
            <strong className="truncate text-lg">Sách Việt</strong>
          </Link>
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--cs-accent)_22%,transparent),transparent_55%)]" />
        <div className="relative mx-auto max-w-2xl px-5 py-20 sm:px-8">
          <p className="cs-eyebrow text-accent-strong">Portal retired</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight">Supplier portal is no longer available</h1>
          <p className="mt-4 text-lg leading-8 text-muted">
            Partner supply workflows moved off this surface. Use the Features catalog for current platform capabilities,
            or sign in to the portal that matches your role.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="cs-button" href="/features">
              See platform status
            </Link>
            <Link className="cs-button cs-button--secondary" href="/">
              Back to storefront
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
