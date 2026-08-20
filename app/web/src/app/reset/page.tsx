import { ResetForm } from "./reset-form";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <section className="cs-surface-heavy w-full rounded-2xl p-7">
        <p className="cs-eyebrow text-accent-strong">Sách Việt</p>
        <h1 className="mt-3 text-3xl font-extrabold">Choose a new password</h1>
        <ResetForm token={token} />
      </section>
    </main>
  );
}
