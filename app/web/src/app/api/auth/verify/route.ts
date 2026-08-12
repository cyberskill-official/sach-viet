import { handleVerifyEmail } from "@/lib/auth-http.mjs";

export async function GET(request: Request) {
  return handleVerifyEmail(request);
}

export async function POST(request: Request) {
  return handleVerifyEmail(request);
}
