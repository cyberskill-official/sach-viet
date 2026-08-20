import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="cs-surface-heavy w-full rounded-2xl p-7">
        <p className="cs-eyebrow text-accent-strong">Sách Việt</p>
        <h1 className="mt-3 text-3xl font-extrabold">Access denied</h1>
        <p className="mt-2 text-muted">Your account does not have access to this portal.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="cs-button" href="/">Back to storefront</Link>
          <Link className="cs-button cs-button--secondary" href="/login">Sign in</Link>
        </div>
      </section>
    </main>
  );
}
