import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  },
  experimental: {
    serverActions: {
        bodySizeLimit: '10mb',
    }
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to import node-specific modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "child_process": false,
        "fs": false,
        "net": false,
        "tls": false,
      };
    }
    return config;
  }
};

export default nextConfig;
