import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@local-service-marketplace/shared-types'],
};

export default nextConfig;
