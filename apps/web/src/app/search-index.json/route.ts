import { searchIndex } from "@content/site/catalog";

export const dynamic = "force-static";

export function GET() {
  return Response.json(searchIndex, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
