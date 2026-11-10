import type { NextConfig } from "next";

const apiUrl = process.env.API_URL?.replace(/\/+$/, "");

if (!apiUrl) {
  throw new Error(
    "A variável de ambiente API_URL não está definida. Configure-a em .env.local.",
  );
}

const storageOrigin = process.env.STORAGE_ORIGIN;

if (storageOrigin && !URL.canParse(storageOrigin)) {
  throw new Error(
    "A variável de ambiente STORAGE_ORIGIN deve ser uma URL, como https://storage.exemplo.com.",
  );
}

const UPLOAD_PROXY_TIMEOUT_MS = 30 * 60 * 1000;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    proxyTimeout: UPLOAD_PROXY_TIMEOUT_MS,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/pacientes",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
