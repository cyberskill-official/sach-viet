import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.cookies.has("sv_session")) return NextResponse.next();
  const login = new URL("/login", request.url);
  login.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/publisher/:path*", "/author/:path*", "/institution/:path*", "/employee/:path*", "/retail/:path*", "/b2b/:path*", "/supplier/:path*"],
};
