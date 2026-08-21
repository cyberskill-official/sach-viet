import { handleGetTours, handlePatchTours } from "@/lib/account-http.mjs";

export async function GET(request: Request) {
  return handleGetTours(request);
}

export async function PATCH(request: Request) {
  return handlePatchTours(request);
}
