import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/og": ["./src/assets/fonts/BricolageGrotesque-Regular.ttf"],
  },
};

export default nextConfig;
