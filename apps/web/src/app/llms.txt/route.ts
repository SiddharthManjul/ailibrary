import { docsNavigation, docsPages, markdownPath } from "@content/site/docs";
import { siteOrigin } from "@/lib/site-metadata";

export const dynamic = "force-static";

export function GET() {
  const byId = new Map(docsPages.map((page) => [page.id, page]));
  const groups = docsNavigation.groups.map((group) => {
    const items = [...group.items ?? [], ...group.sections?.flatMap((section) => section.items) ?? []];
    return `## ${group.title}\n\n${items.map((item) => {
      const page = byId.get(item.id);
      return page ? `- [${page.title}](${siteOrigin}${markdownPath(page.path)}): ${page.lead}` : "";
    }).join("\n")}`;
  });
  const content = `# AI Library\n\nProduction-ready workflows, agents and UI components, packaged as kits for every team.\n\n${groups.join("\n\n")}\n`;
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
