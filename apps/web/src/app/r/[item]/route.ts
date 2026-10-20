import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const publicItems = new Set([
  "registry.json", "ui-foundation.json", "motion.json", "use-controllable-state.json",
  "use-container-size.json", "use-reduced-motion.json", "button-example.json", "chart-frame.json",
]);
// Paid item artifacts may exist beside these build outputs for local tests.
// Never serve them here until server-side entitlement delivery is implemented.

export async function GET(_request: Request, { params }: { params: Promise<{ item: string }> }) {
  const { item } = await params;
  if (!publicItems.has(item)) return Response.json({ error: "Registry item not found" }, { status: 404 });
  const body = await readFile(resolve(process.cwd(), "../../kits/packages/ui-foundation/registry", item), "utf8");
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
