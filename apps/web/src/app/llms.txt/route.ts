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
  const content = `# AI Library\n\nProduction-ready workflows, agents and UI components, packaged as kits for every team.\n\n${groups.join("\n\n")}\n\n## Public UI foundations\n\n- [UI foundation](${siteOrigin}/docs/ui/ui-foundation.md): Semantic theme, motion and state tokens.\n- [Button example](${siteOrigin}/docs/ui/button-example.md): Accessible shadcn button composition.\n- [Chart frame](${siteOrigin}/docs/ui/chart-frame.md): Keyboard inspection and a data table alternative.\n\n## UI component documentation\n\n- [Sparkline](${siteOrigin}/docs/ui/sparkline.md): Inline SVG trend with line, area and bar variants, localized summaries and Fieldline daily lead previews. Component source delivery requires paid access; the local preview does not implement platform entitlements.\n- [Confidence badge](${siteOrigin}/docs/ui/confidence-badge.md): Dynamic labeled model scores, configurable thresholds and accessible reasons. Human review preserves the original model confidence.\n- [Diff viewer](${siteOrigin}/docs/ui/diff-viewer.md): Dynamic text, code, JSON and record comparisons with word highlights, collapsed context and per-change decisions.\n`;
  return new Response(content, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
}
