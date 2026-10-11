import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
    proxyClientMaxBodySize: 200 * 1024 * 1024, // 200MB
  },
};

export default nextConfig;
