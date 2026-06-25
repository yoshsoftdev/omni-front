import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:8070";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow opening dev server via LAN IP (e.g. http://192.168.x.x:3000).
  allowedDevOrigins: ["192.168.113.140"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        // Proxy WebSocket upgrade to backend (dev + when frontend is the edge).
        source: "/ws",
        destination: `${backendUrl}/ws`,
      },
    ];
  },
};

export default nextConfig;
