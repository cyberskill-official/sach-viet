import { computeRoyaltyStatement, computeVendorSettlement } from "@/lib/finance-policy-core.mjs";
import { API_ERROR_CODES, createRequestId, jsonError, jsonOk, readJsonBody } from "@/lib/api-contract.mjs";
import { requirePermission } from "@/lib/authz-http.mjs";

/** Admin-only settlement / royalty compute previews from DEC-SET / DEC-ROY rates. */
export async function POST(request: Request) {
  const requestId = createRequestId(request);
  try {
    const auth = await requirePermission(request, "admin.finance.compute", {
      message: "Administrator access is required.",
    });
    if (!auth.ok) return auth.response;

    const body = await readJsonBody(request);
    if (!body) return jsonError(API_ERROR_CODES.invalid_request, "Invalid compute request.", { status: 400, requestId: auth.requestId });

    const kind = typeof body.kind === "string" ? body.kind.trim() : "";
    if (kind === "settlement") {
      return jsonOk({ settlement: computeVendorSettlement(body) });
    }
    if (kind === "royalty") {
      return jsonOk({ royalty: computeRoyaltyStatement(body) });
    }
    return jsonError(API_ERROR_CODES.invalid_request, "kind must be settlement or royalty.", {
      status: 400,
      requestId: auth.requestId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Finance compute failed.";
    return jsonError(API_ERROR_CODES.invalid_request, message, { status: 400, requestId });
  }
}
