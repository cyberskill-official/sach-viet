import { handleCheckout } from "@/lib/commerce-http.mjs";

export async function POST(request: Request) {
  return handleCheckout(request);
}
