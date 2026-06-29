/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@xenova/transformers"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
