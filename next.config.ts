import type { NextConfig } from "next";

function convexImageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "https", hostname: "*.convex.cloud" },
    { protocol: "https", hostname: "*.convex.site" },
  ];

  for (const value of [process.env.NEXT_PUBLIC_CONVEX_URL, process.env.NEXT_PUBLIC_CONVEX_SITE_URL]) {
    if (!value) continue;
    try {
      const parsed = new URL(value);
      const protocol = parsed.protocol === "http:" ? "http" : "https";
      patterns.push({ protocol, hostname: parsed.hostname });
    } catch {
      // Invalid env value; the Convex wildcards above still apply.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: convexImageRemotePatterns(),
  },
  // No App Router paths or product slugs contained the Lashmealex brand, so
  // there are no old storefront URLs to 301. Add permanent redirects here if a
  // future slug rename ships.
  async redirects() {
    return [];
  },
};

export default nextConfig;
