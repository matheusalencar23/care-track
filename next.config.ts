import type { NextConfig } from "next";

const apiUrl = process.env.API_URL?.replace(/\/+$/, "");

if (!apiUrl) {
  throw new Error(
    "A variável de ambiente API_URL não está definida. Configure-a em .env.local.",
  );
}

const nextConfig: NextConfig = {
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
        // Páginas abertas pelos links enviados por e-mail recebem um token de
        // uso único na URL: não o repassa no cabeçalho Referer.
        source: "/:path(verify-email|reset-password)",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
