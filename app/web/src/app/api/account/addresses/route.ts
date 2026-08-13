import { handleCreateAddress, handleListAddresses } from "@/lib/account-http.mjs";

export async function GET(request: Request) {
  return handleListAddresses(request);
}

export async function POST(request: Request) {
  return handleCreateAddress(request);
}
