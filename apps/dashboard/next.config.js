/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@ghost/types'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4003',
    NEXT_PUBLIC_GHOST_LOG_WS_URL: process.env.NEXT_PUBLIC_GHOST_LOG_WS_URL || 'ws://localhost:4005/ws/logs',
  },
}

module.exports = nextConfig
