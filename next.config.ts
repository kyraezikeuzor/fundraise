import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sunrise ships TypeScript source; transpile it for the Next.js bundler
  transpilePackages: ["@omelora/sunrise"],
};

export default nextConfig;
