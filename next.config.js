/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
      appDir: true,
    },
    // Electron対応のための設定
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }
  
  module.exports = nextConfig