import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import type scenes from "../../../../../kits/packages/seed/recipe/design-scenes.json";
import type { ComponentSourceBundle, ComponentSourceFile } from "./component-source.types";

interface SourceDefinition {
  source: string;
  target: string;
  kind: ComponentSourceFile["kind"];
}

const theme: SourceDefinition = {
  source: "packages/ui-foundation/design-theme.css",
  target: "components/ailibrary/ui-design-theme.css",
  kind: "dependency",
};
const reducedMotion: SourceDefinition = {
  source: "packages/ui-foundation/src/hooks/use-reduced-motion.ts",
  target: "hooks/ailibrary/use-reduced-motion.ts",
  kind: "dependency",
};
const controllableState: SourceDefinition = {
  source: "packages/ui-foundation/src/hooks/use-controllable-state.ts",
  target: "hooks/ailibrary/use-controllable-state.ts",
  kind: "dependency",
};
const accent: SourceDefinition = {
  source: "packages/ui-foundation/src/design-accent.ts",
  target: "lib/ailibrary/design-accent.ts",
  kind: "dependency",
};

// Every input and output path is fixed here. A request can select a known slug,
// never a path, a registry artifact, or an arbitrary file from the repository.
const sourceManifest = {
  sparkline: {
    primitives: ["button"],
    dependencies: ["cn@0.5.0", "motion@14.3.0"],
    files: [
      { source: "ui/components/sparkline/sparkline.demo.tsx", target: "components/ailibrary/sparkline.demo.tsx", kind: "example" },
      { source: "ui/components/sparkline/sparkline.demo.css", target: "components/ailibrary/sparkline.demo.css", kind: "example" },
      { source: "ui/components/sparkline/sparkline.tsx", target: "components/ailibrary/sparkline.tsx", kind: "component" },
      { source: "ui/components/sparkline/sparkline.css", target: "components/ailibrary/sparkline.css", kind: "component" },
      theme, reducedMotion, accent,
    ],
  },
  "confidence-badge": {
    primitives: ["button", "badge", "popover"],
    dependencies: ["cn@0.5.0", "motion@14.3.0"],
    files: [
      { source: "ui/components/confidence-badge/confidence-badge.demo.tsx", target: "components/ailibrary/confidence-badge.demo.tsx", kind: "example" },
      { source: "ui/components/confidence-badge/confidence-badge.demo.css", target: "components/ailibrary/confidence-badge.demo.css", kind: "example" },
      { source: "ui/components/confidence-badge/confidence-badge.tsx", target: "components/ailibrary/confidence-badge.tsx", kind: "component" },
      { source: "ui/components/confidence-badge/confidence-badge.css", target: "components/ailibrary/confidence-badge.css", kind: "component" },
      theme, controllableState, reducedMotion, accent,
    ],
  },
  "diff-viewer": {
    primitives: ["button"],
    dependencies: ["@tanstack/react-virtual@3.14.21", "cn@0.5.0", "diff@9.0.0", "lucide-react@1.58.0", "motion@14.3.0", "shiki@4.5.0"],
    files: [
      { source: "ui/components/diff-viewer/diff-viewer.demo.tsx", target: "components/ailibrary/diff-viewer.demo.tsx", kind: "example" },
      { source: "ui/components/diff-viewer/diff-viewer.demo.css", target: "components/ailibrary/diff-viewer.demo.css", kind: "example" },
      { source: "ui/components/diff-viewer/diff-viewer.examples.tsx", target: "components/ailibrary/diff-viewer.examples.tsx", kind: "example" },
      { source: "ui/components/diff-viewer/diff-viewer.tsx", target: "components/ailibrary/diff-viewer.tsx", kind: "component" },
      { source: "ui/components/diff-viewer/diff-viewer.css", target: "components/ailibrary/diff-viewer.css", kind: "component" },
      { source: "ui/components/diff-viewer/diff-model.ts", target: "components/ailibrary/diff-model.ts", kind: "component" },
      { source: "ui/components/diff-viewer/diff-code.ts", target: "components/ailibrary/diff-code.ts", kind: "component" },
      theme, controllableState, reducedMotion, accent,
    ],
  },
} as const satisfies Record<string, { primitives: readonly string[]; dependencies: readonly string[]; files: readonly SourceDefinition[] }>;

/** The same local targets used by the tested shadcn registry, plus demo helpers. */
function consumerSource(source: string): string {
  return source
    .replaceAll('"./diff-model"', '"@/components/ailibrary/diff-model"')
    .replaceAll('"./diff-code"', '"@/components/ailibrary/diff-code"')
    .replaceAll('"../../../packages/ui-foundation/src/hooks/use-controllable-state"', '"@/hooks/ailibrary/use-controllable-state"')
    .replaceAll('"../../../packages/ui-foundation/src/hooks/use-reduced-motion"', '"@/hooks/ailibrary/use-reduced-motion"')
    .replaceAll('"../../../packages/ui-foundation/src/design-accent"', '"@/lib/ailibrary/design-accent"')
    .replaceAll('"../../../packages/ui-foundation/design-theme.css"', '"./ui-design-theme.css"');
}

function exampleSource(slug: keyof typeof sourceManifest, data: typeof scenes): ComponentSourceFile {
  if (slug === "diff-viewer") return {
    path: "components/ailibrary/diff-viewer-example.tsx", language: "tsx", kind: "example",
    code: `"use client";\n\nimport { DiffViewerDemo } from "@/components/ailibrary/diff-viewer.demo";\n\nexport default function DiffViewerExample() {\n  return (\n    <div data-ui-design>\n      <DiffViewerDemo {...scene} accent="mono" />\n    </div>\n  );\n}\n\n// Synthetic support reply and CRM proposals from the live preview.\nconst scene = ${JSON.stringify(data.diffViewer, null, 2)};\n`,
  };
  const confidence = slug === "confidence-badge";
  const component = confidence ? "ConfidenceBadgeDemo" : "SparklineDemo";
  const declarations = confidence
    ? `const rows = ${JSON.stringify(data.confidenceBadge.rows, null, 2)};\n\nconst updatedRows = ${JSON.stringify(data.confidenceBadge.updatedRows, null, 2)};`
    : `const days = ${JSON.stringify(data.sparkline.days, null, 2)};\n\nconst failures = ${JSON.stringify(data.sparkline.failures)};`;
  const props = confidence ? "rows={rows} updatedRows={updatedRows}" : 'days={days} failures={failures} state="normal" variant="line"';
  return {
    path: `components/ailibrary/${slug}-example.tsx`,
    language: "tsx",
    kind: "example",
    code: `"use client";\n\nimport { ${component} } from "@/components/ailibrary/${slug}.demo";\n\nexport default function ${confidence ? "ConfidenceBadgeExample" : "SparklineExample"}() {\n  return (\n    <div data-ui-design>\n      <${component} ${props} accent="mono" />\n    </div>\n  );\n}\n\n// The exact synthetic data used by the live documentation preview.\n${declarations}\n`,
  };
}

/** Public UI documentation source, independent of protected registry delivery. */
export async function readComponentSource(slug: string): Promise<ComponentSourceBundle | undefined> {
  if (!Object.hasOwn(sourceManifest, slug)) return undefined;
  const knownSlug = slug as keyof typeof sourceManifest;
  const manifest = sourceManifest[knownSlug];
  const root = path.resolve(process.cwd(), "../../kits");
  const [data, files] = await Promise.all([
    readFile(path.resolve(root, "packages/seed/recipe/design-scenes.json"), "utf8").then((source) => JSON.parse(source) as typeof scenes),
    Promise.all(manifest.files.map(async (file): Promise<ComponentSourceFile> => ({
      path: file.target,
      language: path.extname(file.target).slice(1),
      kind: file.kind,
      code: consumerSource(await readFile(path.resolve(root, file.source), "utf8")),
    }))),
  ]);
  return {
    slug: knownSlug,
    registryName: `@ailibrary/${knownSlug}`,
    files: [exampleSource(knownSlug, data), ...files],
    primitives: [...manifest.primitives],
    // React, Tailwind and initialized shadcn are host prerequisites. The complete
    // demo also uses Motion through its shared reduced-motion helper.
    dependencies: [...manifest.dependencies],
  };
}
