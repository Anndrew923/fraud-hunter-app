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
      root: __dirname,
      // 優化 Turbopack 性能
      resolveAlias: {
        // 減少模組解析時間
        'react': 'react',
        'react-dom': 'react-dom'
      }
    },
    // 啟用更快的編譯
    optimizeCss: true,
    // 減少不必要的重新編譯
    swcMinify: true
  },
  // 優化編譯性能
  compiler: {
    // 移除 console.log (生產環境)
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // 減少打包大小
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // 開發環境優化
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/
      }
    }
    return config
  }
};

export default nextConfig;
