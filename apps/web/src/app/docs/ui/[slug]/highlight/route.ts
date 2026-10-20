import { highlightComponentFile } from "@/components/docs/component-code";
import { readComponentSource } from "@/components/docs/component-source";

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=0, must-revalidate",
  "X-Content-Type-Options": "nosniff",
};

function notFound() {
  return new Response(JSON.stringify({ error: "Component source not found" }), { status: 404, headers });
}

/** Select a file already in a public source bundle, never a filesystem path. */
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const query = new URL(request.url).searchParams;
  if (query.getAll("file").length !== 1 || [...query.keys()].some((key) => key !== "file")) return notFound();
  const requestedFile = query.get("file");
  if (!requestedFile) return notFound();
  const { slug } = await context.params;
  const bundle = await readComponentSource(slug);
  const file = bundle?.files.find((entry) => entry.path === requestedFile);
  if (!file) return notFound();
  return new Response(JSON.stringify({ path: file.path, html: await highlightComponentFile(file) }), { headers });
}
