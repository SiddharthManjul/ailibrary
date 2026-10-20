import type { ComponentType } from "react";
import type { MDXProps } from "mdx/types";

import FoundationDocs from "../../../../../kits/packages/ui-foundation/docs/ui-foundation/docs.mdx";
import ButtonDocs from "../../../../../kits/packages/ui-foundation/docs/button-example/docs.mdx";
import ChartDocs from "../../../../../kits/packages/ui-foundation/docs/chart-frame/docs.mdx";
import SparklineDocs from "../../../../../kits/ui/components/sparkline/docs.mdx";
import ConfidenceBadgeDocs from "../../../../../kits/ui/components/confidence-badge/docs.mdx";
import DiffViewerDocs from "../../../../../kits/ui/components/diff-viewer/docs.mdx";

export const docsEntries = [
  {
    slug: "ui-foundation",
    title: "UI foundation",
    description: "A shared language for theme, motion and state.",
    group: "Foundation",
    kind: "foundation",
    Content: FoundationDocs,
  },
  {
    slug: "button-example",
    title: "Button example",
    description: "A small shadcn composition to verify installation and interaction.",
    group: "Examples",
    kind: "foundation",
    Content: ButtonDocs,
  },
  {
    slug: "chart-frame",
    title: "Chart frame",
    description: "A keyboard-accessible frame with a text summary and a table alternative.",
    group: "Foundation",
    kind: "foundation",
    Content: ChartDocs,
  },
  {
    slug: "sparkline",
    title: "Sparkline",
    description: "A tiny SVG trend for lead volume, with line, area and bar variants.",
    group: "Data display",
    kind: "component",
    Content: SparklineDocs,
  },
  {
    slug: "confidence-badge",
    title: "Confidence badge",
    description: "A labeled confidence score with thresholds and accessible reasons.",
    group: "Agent control",
    kind: "component",
    Content: ConfidenceBadgeDocs,
  },
  {
    slug: "diff-viewer",
    title: "Diff viewer",
    description: "Review proposed text, code and record changes, one decision at a time.",
    group: "Agent control",
    kind: "component",
    Content: DiffViewerDocs,
  },
] as const satisfies readonly {
  slug: string;
  title: string;
  description: string;
  group: string;
  kind: "component" | "foundation";
  Content: ComponentType<MDXProps>;
}[];

export type DocsSlug = (typeof docsEntries)[number]["slug"];

export function findDocsEntry(slug: string) {
  return docsEntries.find((entry) => entry.slug === slug);
}
