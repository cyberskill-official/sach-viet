import { handleResetPassword } from "@/lib/auth-http.mjs";

export async function POST(request: Request) {
  return handleResetPassword(request);
}
