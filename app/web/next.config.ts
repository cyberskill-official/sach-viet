import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Interim CSP: `'unsafe-inline'` alone so Next.js App Router RSC flight scripts
 * (`self.__next_f.push`) can run. Do **not** pair a hash/nonce with `'unsafe-inline'`
 * — CSP Level 2+ ignores `'unsafe-inline'` when a hash or nonce is present, which
 * blocked hydration on Production (audit 2026-08-21 C1).
 *
 * Theme/locale boot in `src/app/layout.tsx` relies on `'unsafe-inline'` until a
 * nonce-based CSP middleware is introduced.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Standalone is for Docker/self-host; omit on Vercel so serverless tracing
  // keeps the async `pg` pool layout intact.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "/*": [
      "./migrations/**/*",
      "./node_modules/pg/**/*",
      "./node_modules/pg-*/**/*",
      "./node_modules/postgres-*/**/*",
      "./node_modules/pgpass/**/*",
      "./node_modules/split2/**/*",
      "./node_modules/xtend/**/*",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
