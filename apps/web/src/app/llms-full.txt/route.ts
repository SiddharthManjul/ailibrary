import { docMarkdown, docsPages } from "@content/site/docs";

export const dynamic = "force-static";

export function GET() {
  return new Response(`# AI Library\n\nComplete documentation for workflows, agents, UI and kits.\n\n${docsPages.map(docMarkdown).join("\n\n---\n\n")}`, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}
