import type { NextConfig } from "next";

// Mirrors lib/build-id.ts — keep the two expressions identical. Next stamps
// this onto <html data-dpl-id> and onto asset URLs as ?dpl=, so a deploy can
// never be served a mix of old and new chunks.
const BUILD_ID =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.NEXT_DEPLOYMENT_ID ||
  'dev';

const nextConfig: NextConfig = {
  deploymentId: BUILD_ID,
  experimental: {
    serverActions: {
      bodySizeLimit: '200mb',
    },
    proxyClientMaxBodySize: 200 * 1024 * 1024, // 200MB
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // The installed app must never resume onto a stale document: its HTML
        // is what carries the current build's id and chunk URLs.
        source: '/app/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        // never cached, so a deploy's new worker is picked up on the next load
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
