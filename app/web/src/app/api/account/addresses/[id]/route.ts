import { handleDeleteAddress } from "@/lib/account-http.mjs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return handleDeleteAddress(request, id);
}
