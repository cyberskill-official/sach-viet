import { ResetForm } from "./reset-form";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-12">
      <ResetForm token={token} />
    </main>
  );
}
