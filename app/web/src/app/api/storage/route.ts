import { handlePutStoredObject } from "@/lib/storage-http.mjs";

export async function POST(request: Request) {
  return handlePutStoredObject(request);
}
