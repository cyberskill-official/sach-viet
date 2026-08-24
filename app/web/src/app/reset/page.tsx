import { ResetForm } from "./reset-form";
import { LuxuryAuthFrame } from "@/components/luxury-shell";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <LuxuryAuthFrame>
      <ResetForm token={token} />
    </LuxuryAuthFrame>
  );
}
