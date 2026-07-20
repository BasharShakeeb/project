/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  swcMinify: false,
  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
};

module.exports = nextConfig;
