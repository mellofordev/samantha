import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL
  },
  experimental: {
    serverActions: {
        bodySizeLimit: '10mb',
    }
}
};

export default nextConfig;
