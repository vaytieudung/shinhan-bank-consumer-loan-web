import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/photos/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/models/:path*',
        destination: 'https://www.shinhanfinancer.com/models/:path*'
      }
    ]
  }
}

export default nextConfig
