import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground sm:px-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-sm uppercase tracking-[0.24em] text-zinc-400">SachViet</p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">Greenfield Next.js foundation</h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-300">This application is the starting point for the rebuilt SachViet platform. Product features and legacy system code are intentionally absent.</p>
          <Link className="w-fit rounded border border-zinc-600 px-3 py-2 text-sm hover:border-zinc-300" href="/login">Sign in to the platform</Link>
        </div>
        <dl className="grid gap-px overflow-hidden rounded-xl border border-zinc-700 bg-zinc-700 sm:grid-cols-3">
          <div className="bg-zinc-950 p-5">
            <dt className="font-mono text-xs uppercase tracking-wide text-zinc-500">Application</dt>
            <dd className="mt-2 text-sm text-zinc-100">Next.js App Router</dd>
          </div>
          <div className="bg-zinc-950 p-5">
            <dt className="font-mono text-xs uppercase tracking-wide text-zinc-500">Runtime</dt>
            <dd className="mt-2 text-sm text-zinc-100">Node.js 24</dd>
          </div>
          <div className="bg-zinc-950 p-5">
            <dt className="font-mono text-xs uppercase tracking-wide text-zinc-500">Delivery</dt>
            <dd className="mt-2 text-sm text-zinc-100">Docker and CapRover ready</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
