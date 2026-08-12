import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionTokenSignature } from "@/lib/auth-core.mjs";
import { portalForPath } from "@/lib/access.mjs";
import { isSameOriginRequest } from "@/lib/csrf.mjs";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/api/webhooks/") ||
    pathname.startsWith("/api/cron/") ||
    pathname === "/api/health"
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
    "/supplier/:path*",
    "/api/:path*",
  ],
};
