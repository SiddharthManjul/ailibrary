import { readComponentSource } from "@/components/docs/component-source";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
};

/** Whole documentation bundles only; no requested filenames or query API. */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  if (new URL(request.url).search) {
    return new Response(JSON.stringify({ error: "Component source not found" }), { status: 404, headers });
  }
  const { slug } = await context.params;
  const source = await readComponentSource(slug);
  if (source === undefined) {
    return new Response(JSON.stringify({ error: "Component source not found" }), { status: 404, headers });
  }
  return new Response(`${JSON.stringify(source)}\n`, { headers });
}
