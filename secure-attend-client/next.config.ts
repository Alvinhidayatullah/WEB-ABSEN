import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:5150/graphql',
      },
    ];
  },
};

export default nextConfig;
