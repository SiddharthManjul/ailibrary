import Link from "next/link";
import type { CSSProperties } from "react";
import { docLink, docMarkdown, docsNavigation, markdownPath } from "@content/site/docs";
import type { DocBlock, DocPage } from "@content/site/docs-types";
import { blocks as uiBlocks, components } from "@content/site/catalog";
import { siteOrigin } from "@/lib/site-metadata";
import { Icon, Trio } from "./shared";
import { DocCodeBlock, DocCodeTabs, DocCopyButton, DocInstallUI, DocSteps, DocToc, PackageManagerCommand } from "./docs-interactive";
import { DocPreview } from "./docs-preview";
import { DocsWorkspace } from "./docs-navigation";
import type { ThumbnailData } from "./thumbnail";

export function DocBlocks({ blocks, docId }: { blocks: readonly DocBlock[]; docId?: string }) {
  const thumbnail = [...components, ...uiBlocks].find((item) => item.docId === docId)?.thumbnail;
  return blocks.map((block, index) => <DocBlockView block={block} thumbnail={thumbnail} key={index} />);
}

export function DocBlockView({ block, thumbnail }: { block: DocBlock; thumbnail?: ThumbnailData }) {
  switch (block.type) {
    case "h2": return <h2 className="st-h2" id={block.anchor}>{block.text}<a className="st-heading-anchor" href={`#${block.anchor}`} aria-label={`Link to ${block.text}`}>#</a></h2>;
    case "p": return <p className="st-p">{block.text}</p>;
    case "ul": return <ul className="st-ul">{block.items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
    case "ol": return <DocSteps items={block.items} />;
    case "code": return <DocCodeBlock {...block} />;
    case "tabs": return <DocCodeTabs tabs={block.tabs} />;
    case "pm-command": return <PackageManagerCommand command={block.command} />;
    case "install-ui": return <DocInstallUI command={block.command} manual={block.manual} />;
    case "table": return <div className="st-dtbl st-doc-table" tabIndex={0} role="region" aria-label={`${block.columns.join(", ")} reference table`} style={{ "--gtc": block.grid } as CSSProperties}><table><thead><tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{block.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell.kind === "code" ? <code>{cell.text}</code> : cell.kind === "kbd" ? <span className="st-doc-keys">{cell.text.split(/\s*\+\s*/).map((key, keyIndex) => <kbd key={keyIndex}>{key}</kbd>)}</span> : cell.kind === "badge" || cell.kind === "badge-write" ? <span className={`st-doc-badge${cell.kind === "badge-write" ? " is-write" : ""}`}>{cell.text}</span> : cell.text}</td>)}</tr>)}</tbody></table></div>;
    case "callout": return <aside className={`st-call is-${block.tone}`}><Icon name="info" /><p>{block.text}</p></aside>;
    case "kv": return <dl className="st-kv">{block.rows.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>;
    case "chips": return <div className="st-dchips">{block.chips.map((chip, index) => chip.docId ? <Link className="is-link" key={index} href={docsNavigation.pathOf[chip.docId]}>{chip.text}</Link> : <span key={index}>{chip.text}</span>)}</div>;
    case "stats": return <div className="st-dstats">{block.stats.map((stat) => <div key={stat.label}><span>{stat.label}</span><b>{stat.value}</b></div>)}</div>;
    case "flow": return <div className="st-dflow" aria-label="Workflow steps">{block.nodes.map((node, index) => <div className="st-dflow-n" key={`${node.title}-${index}`}><span><Icon name={node.icon} /></span><b>{node.title}</b><em>{node.sub}</em></div>)}</div>;
    case "cards": return <div className="st-dcards">{block.cards.map((card) => <Link href={docsNavigation.pathOf[card.docId]} key={card.docId}><b>{card.title}{card.tag && <em>{card.tag}</em>}</b><span>{card.desc}</span></Link>)}</div>;
    case "preview": return <DocPreview {...block} thumbnailData={thumbnail} />;
  }
}

export function DocsArticle({ page }: { page: DocPage }) {
  const previous = docLink(page.prev);
  const next = docLink(page.next);
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Docs", item: `${siteOrigin}/docs` },
      ...(page.path === "/docs" ? [] : [{ "@type": "ListItem", position: 2, name: page.title, item: `${siteOrigin}${page.path}` }]),
    ],
  };
  return <DocsWorkspace navigation={docsNavigation} currentId={page.id} title={page.title} key={page.id}><main className="st-doc" id="site-content" tabIndex={-1}><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replaceAll("<", "\\u003c") }} /><nav className="st-crumb" aria-label="Breadcrumb">{page.crumbs.map((crumb, index) => <span key={`${crumb}-${index}`} className={index === page.crumbs.length - 1 ? "is-on" : ""}>{index === 0 ? <Link href="/docs">{crumb}</Link> : crumb}{index < page.crumbs.length - 1 && <Icon name="chevr" />}</span>)}</nav><div className="st-dt"><h1 data-testid="doc-title">{page.title}</h1><div className="st-dt-a"><DocCopyButton text={docMarkdown(page)} label="Copy page" /><a href={markdownPath(page.path)}><Icon name="file" />Markdown</a></div></div><p className="st-dlead">{page.lead}</p>{page.meta.length > 0 && <div className="st-dmeta">{page.meta.map((meta, index) => <span key={index}>{meta.kitTrio && <Trio colors={meta.kitTrio} />}{meta.text}</span>)}</div>}<DocBlocks blocks={page.blocks} docId={page.id} /><nav className="st-dpn" aria-label="Documentation pages">{previous && <Link href={previous.path} data-testid="doc-prev"><span>Previous</span><b>{previous.title}</b></Link>}{next && <Link className="is-next" href={next.path} data-testid="doc-next"><span>Next</span><b>{next.title}</b></Link>}</nav></main><DocToc toc={page.toc} /></DocsWorkspace>;
}
