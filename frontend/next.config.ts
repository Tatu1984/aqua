import type { NextConfig } from "next";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  transpilePackages: ["@aqua/shared"],
  async redirects() {
    return [
      {
        source: "/admin",
        destination: `${BACKEND_URL}/admin`,
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: `${BACKEND_URL}/admin/:path*`,
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
