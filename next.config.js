/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // App Routerはデフォルトで有効
  },
  webpack: (config, { isServer, dev }) => {
    if (dev) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        // 大きな文字列のシリアライゼーション警告を回避
        compression: 'gzip',
      };
    }
    return config;
  },
}