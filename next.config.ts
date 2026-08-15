import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['require-in-the-middle', '@sentry/nextjs', '@sentry/node'],
};

export default nextConfig;
