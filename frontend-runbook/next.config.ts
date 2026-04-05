import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["http://localhost:3000"],
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
