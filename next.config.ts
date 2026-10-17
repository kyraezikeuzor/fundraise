import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Sunrise ships TypeScript source; transpile it for the Next.js bundler
  transpilePackages: ["@omelora/sunrise"],
  // omelora.org forwards /projects/* here (Next.js multi-zones). The prefix keeps
  // this app's JS and CSS from colliding with omelora.org's own /_next files.
  assetPrefix: "/projects-static",
};

export default nextConfig;
