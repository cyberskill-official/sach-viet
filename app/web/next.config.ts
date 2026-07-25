import type { NextConfig } from "next";
import { createHash } from "node:crypto";

/** Must match the inline theme boot script in `src/app/layout.tsx`. */
const THEME_INIT_SCRIPT =
  '(function(){try{var t=localStorage.getItem("sv_theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();';
const THEME_SCRIPT_SHA256 = createHash("sha256").update(THEME_INIT_SCRIPT).digest("base64");

const isProd = process.env.NODE_ENV === "production";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'sha256-${THEME_SCRIPT_SHA256}'`,
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
  output: "standalone",
  poweredByHeader: false,
  // `pg` stays external; include it (and the synckit worker) in standalone
  // tracing so /app/node_modules/pg exists for db-worker.mjs at runtime.
  serverExternalPackages: ["pg"],
  outputFileTracingIncludes: {
    "/*": [
      "./src/lib/db-worker.mjs",
      "./node_modules/pg/**/*",
      "./node_modules/pg-*/**/*",
      "./node_modules/postgres-*/**/*",
      "./node_modules/pgpass/**/*",
      "./node_modules/split2/**/*",
      "./node_modules/xtend/**/*",
      "./node_modules/synckit/**/*",
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
