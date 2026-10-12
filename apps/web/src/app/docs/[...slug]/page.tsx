import { notFound } from "next/navigation";
import { docsPages, findDocPage, markdownPath } from "@content/site/docs";
import { DocsArticle } from "@/components/site/docs-article";
import { pageMetadata, siteOrigin } from "@/lib/site-metadata";

type Props = { params: Promise<{ slug: string[] }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return docsPages.filter((page) => page.path !== "/docs").map((page) => ({ slug: page.path.slice("/docs/".length).split("/") }));
}

export async function generateMetadata({ params }: Props) {
  const page = findDocPage(`/docs/${(await params).slug.join("/")}`);
  if (!page) return {};
  const metadata = pageMetadata(`${page.title} · AI Library Docs`, page.lead, page.path);
  return { ...metadata, alternates: { ...metadata.alternates, types: { "text/markdown": new URL(markdownPath(page.path), siteOrigin).href } } };
}

export default async function DocumentationPage({ params }: Props) {
  const page = findDocPage(`/docs/${(await params).slug.join("/")}`);
  if (!page) notFound();
  return <DocsArticle page={page} />;
}
