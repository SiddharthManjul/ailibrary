import { notFound } from "next/navigation";
import { findDocPage, markdownPath } from "@content/site/docs";
import { DocsArticle } from "@/components/site/docs-article";
import { pageMetadata, siteOrigin } from "@/lib/site-metadata";

export function generateMetadata() {
  const page = findDocPage("/docs");
  if (!page) return {};
  const metadata = pageMetadata(`${page.title} · AI Library Docs`, page.lead, page.path);
  return { ...metadata, alternates: { ...metadata.alternates, types: { "text/markdown": new URL(markdownPath(page.path), siteOrigin).href } } };
}

export default function DocsPage() {
  const page = findDocPage("/docs");
  if (!page) notFound();
  return <DocsArticle page={page} />;
}
