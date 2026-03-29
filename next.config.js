/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    legacyBrowsers: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
    };
    return config;
  },
};

module.exports = nextConfig;