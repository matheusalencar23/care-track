import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
