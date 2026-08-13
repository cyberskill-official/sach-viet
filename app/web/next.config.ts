import type { NextConfig } from "next";
import { createHash } from "node:crypto";

/** Must match the inline theme boot script in `src/app/layout.tsx`. */
const THEME_INIT_SCRIPT =
  '(function(){try{var t=localStorage.getItem("sv_theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();';
const THEME_SCRIPT_SHA256 = createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64");

const isProd = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' is required for Next.js App Router RSC flight payloads (`self.__next_f`).
  // The theme boot hash remains so the inline theme script is explicitly allowed.
  `script-src 'self' 'unsafe-inline' 'sha256-${THEME_SCRIPT_SHA256}'`,
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
