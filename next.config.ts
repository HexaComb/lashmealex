import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No App Router paths or product slugs contained the Lashmealex brand, so
  // there are no old storefront URLs to 301. Add permanent redirects here if a
  // future slug rename ships.
  async redirects() {
    return [];
  },
};

export default nextConfig;
