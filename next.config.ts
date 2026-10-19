import type { NextConfig } from "next";

// Backend target for the /api/v1 proxy (server-side only, not exposed to the browser).
const API_PROXY_TARGET = (process.env.API_PROXY_TARGET || "http://localhost:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_PROXY_TARGET}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
