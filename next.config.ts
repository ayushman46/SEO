import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

/**
 * Vercel preview deployments inject the Vercel Toolbar / Comments (scripts, styles, fonts and a
 * frame from vercel.live, websockets to Pusher). Allow those on preview ONLY; the production and
 * local policies are unchanged. VERCEL_ENV is "production" | "preview" | "development" on Vercel.
 */
const isVercelPreview = process.env.VERCEL_ENV === "preview";
const preview = (sources: string): string => (isVercelPreview ? ` ${sources}` : "");

/**
 * Content Security Policy (static, no nonces — see DECISIONS ADR-012).
 * 'unsafe-inline' scripts are needed for Next's inline bootstrap without per-request nonces;
 * 'unsafe-eval' only in development (React dev tooling).
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com${preview("https://vercel.live")}`,
  `style-src 'self' 'unsafe-inline'${preview("https://vercel.live")}`,
  `img-src 'self' data: blob:${preview("https://vercel.live https://vercel.com")}`,
  `font-src 'self'${preview("https://vercel.live https://assets.vercel.com")}`,
  `connect-src 'self' https://vitals.vercel-insights.com${preview("https://vercel.live wss://ws-us3.pusher.com")}`,
  ...(isVercelPreview ? ["frame-src https://vercel.live"] : []),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-Frame-Options", value: "DENY" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  poweredByHeader: false,
  // Keep server-only DB driver out of the client asset graph (QA T012).
  serverExternalPackages: ["postgres"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
    ];
  },
};

export default nextConfig;
