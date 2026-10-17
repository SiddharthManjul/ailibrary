import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  outputFileTracingIncludes: {
    "/og": ["./src/assets/fonts/BricolageGrotesque-Regular.ttf"],
  },
  async rewrites() {
    return [{ source: "/docs/:slug*.md", destination: "/markdown/:slug*" }];
  },
  async redirects() {
    return [
      { source: "/changelog", destination: "/docs/reference/changelog", permanent: true },
      ...["sales", "support", "marketing", "engineering", "operations"].map(kit => ({
        source: `/kits/${kit}`,
        destination: `/kits#${kit}`,
        permanent: true,
      })),
    ];
  },
};

export default nextConfig;
