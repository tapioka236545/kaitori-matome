import type { NextConfig } from "next";

const isCapacitorBuild = process.env.BUILD_TARGET === "ios";

const nextConfig: NextConfig = {
  ...(isCapacitorBuild ? { output: "export" } : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;