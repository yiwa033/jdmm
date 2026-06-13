import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    '.space-z.ai',
    'space-z.ai',
    'localhost',
    'preview-chat-a5c885a3-c092-4cc3-acae-19218f88576d.space-z.ai',
    'x150v5dunza1-d.space-z.ai',
  ],
};

export default nextConfig;
