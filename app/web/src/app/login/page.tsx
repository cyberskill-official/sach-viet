import { LoginForm } from "./login-form";
import { LuxuryAuthFrame } from "@/components/luxury-shell";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ redirect?: string }> }) {
  const params = await searchParams;
  const redirectTo = typeof params.redirect === "string" && params.redirect.startsWith("/") && !params.redirect.startsWith("//") ? params.redirect : "/";
  return (
    <LuxuryAuthFrame>
      <LoginForm redirectTo={redirectTo} />
    </LuxuryAuthFrame>
  );
}
