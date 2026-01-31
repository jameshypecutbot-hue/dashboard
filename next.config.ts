import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove 'export' output to support API routes
  // output: 'export', // Disabled for Vercel serverless deployment
  // distDir: 'dist', // Use default .next folder
  
  // Vercel-specific optimizations
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
};

export default nextConfig;
