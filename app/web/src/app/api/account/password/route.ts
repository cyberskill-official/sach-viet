import { handleChangeAccountPassword } from "@/lib/account-http.mjs";

export async function POST(request: Request) {
  return handleChangeAccountPassword(request);
}
