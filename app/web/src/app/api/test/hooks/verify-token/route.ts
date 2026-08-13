import { handleGetVerifyToken } from "@/lib/test-hooks-http.mjs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleGetVerifyToken(request);
}
