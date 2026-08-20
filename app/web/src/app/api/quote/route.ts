import { handleQuote } from "@/lib/commerce-http.mjs";

export async function POST(request: Request) {
  return handleQuote(request);
}
