import type { NextConfig } from "next";

const rawBackendUrl = process.env.BACKEND_URL || "http://backend:8000";
const BACKEND_URL = rawBackendUrl.endsWith('/') ? rawBackendUrl.slice(0, -1) : rawBackendUrl;

console.log(`[Proxy] Connecting to backend at: ${BACKEND_URL}`);

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${BACKEND_URL}/ws/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${BACKEND_URL}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
