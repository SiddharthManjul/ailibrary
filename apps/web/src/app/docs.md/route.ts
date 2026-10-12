import { docMarkdown, findDocPage } from "@content/site/docs";

export const dynamic = "force-static";

export function GET() {
  const page = findDocPage("/docs");
  if (!page) return new Response("Not found", { status: 404 });
  return new Response(docMarkdown(page), { headers: { "Content-Type": "text/markdown; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}
