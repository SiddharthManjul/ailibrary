import { readDocsSource } from "@/components/docs/source";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const source = await readDocsSource(slug);
  if (source === undefined) return new Response("Documentation not found.\n", { status: 404 });
  return new Response(source, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
