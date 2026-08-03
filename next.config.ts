import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['require-in-the-middle', '@sentry/nextjs', '@sentry/node', 'cashfree-pg'],
};

export default nextConfig;
