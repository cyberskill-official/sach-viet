import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionTokenSignature } from "@/lib/auth-core.mjs";
import { portalForPath } from "@/lib/access.mjs";
import { isSameOriginRequest } from "@/lib/csrf.mjs";
import { isRetiredSupplierPath } from "@/lib/production-retirement.mjs";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isRetiredSupplierPath(pathname)) {
    return NextResponse.json({ error: "Supplier portal is retired." }, { status: 410 });
  }

  if (
    pathname.startsWith("/api/test/") &&
    (process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production")
  ) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  if (
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/api/cron/") ||
    pathname === "/api/health" ||
    pathname === "/api/ready"
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") && MUTATING.has(request.method) && !isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  }

  const portal = portalForPath(pathname);
  if (!portal) return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!verifySessionTokenSignature(token, process.env.AUTH_SESSION_SECRET)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/vendor/:path*",
    "/publisher/:path*",
    "/author/:path*",
    "/institution/:path*",
    "/employee/:path*",
    "/retail/:path*",
    "/b2b/:path*",
    "/supplier",
    "/supplier/:path*",
    "/api/:path*",
  ],
};
