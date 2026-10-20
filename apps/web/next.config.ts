import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
  },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  transpilePackages: ["@ai-library/ui-foundation", "@ai-library/sparkline", "@ai-library/confidence-badge", "@ai-library/diff-viewer"],
  outputFileTracingIncludes: {
    "/og": ["../../kits/packages/seed/recipe/fonts/BricolageGrotesque-Regular.ttf"],
    "/docs/source/*": ["../../kits/packages/ui-foundation/docs/**/*.mdx", "../../kits/ui/components/*/docs.mdx"],
    "/docs/ui/**": [
      "../../kits/packages/ui-foundation/docs/**/*.mdx", "../../kits/ui/components/*/docs.mdx",
      "../../kits/packages/seed/recipe/design-scenes.json",
      "../../kits/packages/ui-foundation/design-theme.css",
      "../../kits/packages/ui-foundation/src/design-accent.ts",
      "../../kits/packages/ui-foundation/src/hooks/use-controllable-state.ts",
      "../../kits/packages/ui-foundation/src/hooks/use-reduced-motion.ts",
      "../../kits/ui/components/sparkline/sparkline.tsx",
      "../../kits/ui/components/sparkline/sparkline.css",
      "../../kits/ui/components/sparkline/sparkline.demo.tsx",
      "../../kits/ui/components/sparkline/sparkline.demo.css",
      "../../kits/ui/components/confidence-badge/confidence-badge.tsx",
      "../../kits/ui/components/confidence-badge/confidence-badge.css",
      "../../kits/ui/components/confidence-badge/confidence-badge.demo.tsx",
      "../../kits/ui/components/confidence-badge/confidence-badge.demo.css",
      "../../kits/ui/components/diff-viewer/diff-viewer.tsx",
      "../../kits/ui/components/diff-viewer/diff-viewer.css",
      "../../kits/ui/components/diff-viewer/diff-viewer.demo.tsx",
      "../../kits/ui/components/diff-viewer/diff-viewer.demo.css",
      "../../kits/ui/components/diff-viewer/diff-viewer.examples.tsx",
      "../../kits/ui/components/diff-viewer/diff-model.ts",
      "../../kits/ui/components/diff-viewer/diff-code.ts",
    ],
    "/llms-full.txt": ["../../kits/ui/components/*/docs.mdx"],
    "/r/*": [
      "../../kits/packages/ui-foundation/registry/registry.json",
      "../../kits/packages/ui-foundation/registry/ui-foundation.json",
      "../../kits/packages/ui-foundation/registry/motion.json",
      "../../kits/packages/ui-foundation/registry/use-controllable-state.json",
      "../../kits/packages/ui-foundation/registry/use-container-size.json",
      "../../kits/packages/ui-foundation/registry/use-reduced-motion.json",
      "../../kits/packages/ui-foundation/registry/button-example.json",
      "../../kits/packages/ui-foundation/registry/chart-frame.json",
    ],
  },
  outputFileTracingExcludes: {
    "/r/*": ["../../kits/packages/ui-foundation/registry/sparkline.json", "../../kits/packages/ui-foundation/registry/confidence-badge.json", "../../kits/packages/ui-foundation/registry/diff-viewer.json", "../../kits/packages/ui-foundation/registry/ui-design-theme.json"],
  },
  async rewrites() {
    return [
      { source: "/docs/ui/:slug.md", destination: "/docs/source/:slug" },
      { source: "/docs/:slug*.md", destination: "/markdown/:slug*" },
    ];
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

const withMDX = createMDX({ options: { remarkPlugins: ["remark-gfm"] } });
export default withMDX(nextConfig);
