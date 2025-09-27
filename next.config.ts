import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  outputFileTracingRoot: __dirname,
  experimental: {
    turbo: {
      root: __dirname
    }
  }
};

export default nextConfig;
