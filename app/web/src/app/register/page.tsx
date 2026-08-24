import { RegisterForm } from "./register-form";
import { LuxuryAuthFrame } from "@/components/luxury-shell";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const params = await searchParams;
  const fromCircle = params.from === "circle";
  return (
    <LuxuryAuthFrame>
      <RegisterForm fromCircle={fromCircle} />
    </LuxuryAuthFrame>
  );
}
