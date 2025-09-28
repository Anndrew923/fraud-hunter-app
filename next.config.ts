import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // 開發環境優化
  ...(process.env.NODE_ENV === 'development' && {
    // 開發環境專用優化
    swcMinify: false, // 開發時關閉 SWC 壓縮以提升速度
    compress: false,   // 開發時關閉壓縮
  }),
  // 生產環境優化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  }
};

export default nextConfig;
