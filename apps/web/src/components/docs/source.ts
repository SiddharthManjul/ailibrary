import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

const sourcePaths: Record<string, string> = {
  "ui-foundation": "packages/ui-foundation/docs/ui-foundation/docs.mdx",
  "button-example": "packages/ui-foundation/docs/button-example/docs.mdx",
  "chart-frame": "packages/ui-foundation/docs/chart-frame/docs.mdx",
  sparkline: "ui/components/sparkline/docs.mdx",
  "confidence-badge": "ui/components/confidence-badge/docs.mdx",
  "diff-viewer": "ui/components/diff-viewer/docs.mdx",
};

/** Only public documentation sources may cross this boundary. */
export const readDocsSource = cache(async (slug: string): Promise<string | undefined> => {
  const source = Object.hasOwn(sourcePaths, slug) ? sourcePaths[slug] : undefined;
  return source ? readFile(path.resolve(process.cwd(), "../../kits", source), "utf8") : undefined;
});

export function headingAnchor(text: string) {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, "").trim().replace(/\s+/g, "-");
}

export function docsHeadings(source: string) {
  const reserved = new Set([...source.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
  let fenced = false;
  return source.split("\n").flatMap((line) => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return []; }
    if (fenced || !line.startsWith("## ")) return [];
    const text = line.slice(3).trim();
    const base = headingAnchor(text);
    return [{ text, anchor: reserved.has(base) ? `${base}-section` : base }];
  });
}
