import Link from "next/link";
import type { Metadata } from "next";
import { Children, isValidElement, type ComponentProps, type ReactNode } from "react";
import { notFound } from "next/navigation";
import { docsNavigation } from "@content/site/docs";
import type { DocNavigation } from "@content/site/docs-types";

import { docsEntries, findDocsEntry } from "@/components/docs/content";
import { getFieldlineChartRows, getUIDesignConfidenceScene, getUIDesignDiffScene, getUIDesignSparklineScene } from "@/components/docs/fieldline";
import { LivePreview } from "@/components/docs/live-preview";
import { readComponentSource } from "@/components/docs/component-source";
import { highlightComponentFile } from "@/components/docs/component-code";
import { CodeView } from "@/components/docs/code-view";
import { ComponentDocsProvider, ComponentInstallation, ComponentQuickInstall, ComponentWorkbench } from "@/components/docs/component-workbench";
import { docsHeadings, headingAnchor, readDocsSource } from "@/components/docs/source";
import { DocsWorkspace } from "@/components/site/docs-navigation";
import { DocCopyButton, DocToc } from "@/components/site/docs-interactive";
import { Icon } from "@/components/site/shared";
import styles from "@/components/docs/item-docs.module.css";

type Props = { params: Promise<{ slug: string }> };

function textContent(node: ReactNode): string {
  return Children.toArray(node).map((child) => isValidElement<{ children?: ReactNode }>(child)
    ? textContent(child.props.children) : typeof child === "string" || typeof child === "number" ? String(child) : "").join("");
}

async function DocsCodeBlock(props: ComponentProps<"pre">) {
  const code = Children.toArray(props.children).find(isValidElement<{ className?: string; children?: ReactNode }>);
  const language = code?.props.className?.replace(/^language-/, "");
  const text = textContent(props.children).replace(/\n$/, "");
  const html = language && ["tsx", "ts", "css"].includes(language)
    ? await highlightComponentFile({ path: `example.${language}`, language, code: text, kind: "example" }) : undefined;
  return <div className="st-code"><div className="st-code-h"><span>{language ? `example.${language}` : "Code"}</span><DocCopyButton text={text} /></div><CodeView code={text} html={html} label={`${language ?? "Code"} example`} compact /></div>;
}

function DocsTable(props: ComponentProps<"table">) {
  return <div className={`st-dtbl st-doc-table ${styles.table}`} tabIndex={0} role="region" aria-label="Scrollable component reference">
    <table {...props} aria-label="Component reference" />
  </div>;
}

// Keep the live site's catalog navigation, with local foundation samples added
// only for these unpublished implementation docs. Published pages stay intact.
const navigation: DocNavigation = {
  pathOf: {
    ...docsNavigation.pathOf,
    ...Object.fromEntries(docsEntries.map(({ slug, kind }) => [`${kind}:${slug}`, `/docs/ui/${slug}`])),
  },
  groups: [
    docsNavigation.groups[0]!,
    { key: "foundation-samples", title: "Foundation samples", defaultOpen: false,
      items: docsEntries.filter(({ kind }) => kind === "foundation").map(({ slug, title }) => ({ id: `foundation:${slug}`, title })) },
    ...docsNavigation.groups.slice(1),
  ],
};

export function generateStaticParams() {
  return docsEntries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const entry = findDocsEntry((await params).slug);
  return entry ? { title: entry.title, description: entry.description } : {};
}

export default async function UIItemDocsPage({ params }: Props) {
  const entry = findDocsEntry((await params).slug);
  if (!entry) notFound();
  const { Content, slug, title } = entry;
  const source = await readDocsSource(slug);
  if (source === undefined) notFound();
  const toc = docsHeadings(source);
  const lead = source.split(/\n\s*\n/)[1]?.trim();
  const rows = slug === "chart-frame" ? getFieldlineChartRows() : [];
  const scene = slug === "sparkline" ? getUIDesignSparklineScene() : undefined;
  const confidenceScene = slug === "confidence-badge" ? getUIDesignConfidenceScene() : undefined;
  const diffScene = slug === "diff-viewer" ? getUIDesignDiffScene() : undefined;
  const componentSource = await readComponentSource(slug);
  const currentId = `${entry.kind}:${slug}`;
  const index = docsEntries.indexOf(entry);
  const previous = docsEntries[index - 1];
  const next = docsEntries[index + 1];

  return <DocsWorkspace navigation={navigation} currentId={currentId} title={title} key={slug}>
    <main className="st-doc" id="site-content" tabIndex={-1}>
      <nav className="st-crumb" aria-label="Breadcrumb">
        <span><Link href="/docs">Docs</Link><Icon name="chevr" /></span>
        <span>{entry.kind === "component" ? "Components" : "Foundation"}<Icon name="chevr" /></span>
        <span className="is-on">{title}</span>
      </nav>
      <div className="st-dt">
        <h1 data-testid="doc-title">{title}</h1>
        <div className="st-dt-a"><DocCopyButton text={source} label="Copy page" /><a href={`/docs/ui/${slug}.md`}><Icon name="file" />Markdown</a></div>
      </div>
      <div className={styles.content}>
        <ComponentDocsProvider source={componentSource}>
        <Content components={{
          h1: () => null,
          h2: ({ children }) => {
            const text = textContent(children);
            const anchor = toc.find((heading) => heading.text === text)?.anchor ?? headingAnchor(text);
            return <h2 className="st-h2" id={anchor}>{children}<a className="st-heading-anchor" href={`#${anchor}`} aria-label={`Link to ${text}`}>#</a></h2>;
          },
          p: (props) => <p {...props} className={textContent(props.children) === lead ? "st-dlead" : "st-p"} />,
          ul: (props) => <ul {...props} className="st-ul" />,
          LivePreview: () => <><ComponentQuickInstall /><ComponentWorkbench><LivePreview item={slug} chartRows={rows} leadDays={scene?.days} failures={scene?.failures} confidenceRows={confidenceScene?.rows} confidenceUpdatedRows={confidenceScene?.updatedRows} diffScene={diffScene} /></ComponentWorkbench></>,
          ComponentInstallation,
          pre: DocsCodeBlock,
          table: DocsTable,
        }} />
        </ComponentDocsProvider>
      </div>
      <nav className="st-dpn" aria-label="Documentation pages">
        {previous && <Link href={`/docs/ui/${previous.slug}`} data-testid="doc-prev"><span>Previous</span><b>{previous.title}</b></Link>}
        {next && <Link href={`/docs/ui/${next.slug}`} className="is-next" data-testid="doc-next"><span>Next</span><b>{next.title}</b></Link>}
      </nav>
    </main>
    <DocToc toc={toc} editHref={null} />
  </DocsWorkspace>;
}
