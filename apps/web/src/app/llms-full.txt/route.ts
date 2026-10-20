import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { docMarkdown, docsPages } from "@content/site/docs";

export const dynamic = "force-static";

export async function GET() {
  const componentDocs = await Promise.all(["sparkline", "confidence-badge", "diff-viewer"].map((slug) => readFile(resolve(process.cwd(), `../../kits/ui/components/${slug}/docs.mdx`), "utf8")));
  return new Response(`# AI Library\n\nComplete documentation for workflows, agents, UI and kits.\n\n${docsPages.map(docMarkdown).join("\n\n---\n\n")}\n\n---\n\n${componentDocs.join("\n\n---\n\n")}`, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}
