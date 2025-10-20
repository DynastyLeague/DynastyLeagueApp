import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '/uc**',
      },
      {
        protocol: 'https',
        hostname: 'www.basketball-reference.com',
        port: '',
        pathname: '/req/**',
      },
    ],
  },
};

export default nextConfig;
