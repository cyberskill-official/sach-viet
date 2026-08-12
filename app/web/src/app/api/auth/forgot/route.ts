import { handleForgotPassword } from "@/lib/auth-http.mjs";

export async function POST(request: Request) {
  return handleForgotPassword(request);
}
