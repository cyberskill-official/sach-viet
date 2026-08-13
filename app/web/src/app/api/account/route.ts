import { handleGetAccount, handleUpdateAccount } from "@/lib/account-http.mjs";

export async function GET(request: Request) {
  return handleGetAccount(request);
}

export async function PATCH(request: Request) {
  return handleUpdateAccount(request);
}
