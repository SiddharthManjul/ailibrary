import { docMarkdown, docsPages, findDocPage } from "@content/site/docs";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return docsPages.filter((page) => page.path !== "/docs").map((page) => ({ slug: page.path.slice("/docs/".length).split("/") }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const page = findDocPage(`/docs/${(await params).slug.join("/")}`);
  if (!page) return new Response("Not found", { status: 404 });
  return new Response(docMarkdown(page), { headers: { "Content-Type": "text/markdown; charset=utf-8", "X-Content-Type-Options": "nosniff" } });
}
