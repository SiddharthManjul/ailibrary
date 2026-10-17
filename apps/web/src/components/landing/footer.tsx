import Link from "next/link";
import { homeCopy } from "@content/home";
import { BrandMark } from "@/components/brand-mark";

export function Footer() {
  return <footer className="lp-foot" data-testid="site-footer"><div className="lp-wrap"><div className="lp-foot-g"><div className="lp-foot-b"><Link className="al-brand" href="/#top" prefetch={false} aria-label="AI Library home"><BrandMark className="al-mark" /><span>AI Library</span></Link><p>{homeCopy.footer.description}</p></div>{homeCopy.footerColumns.map((column) => <div className="lp-foot-c" key={column.title}><h2>{column.title}</h2>{column.links.map((link) => <a href={link.href ?? undefined} aria-disabled={link.href === null ? true : undefined} title={link.href === null ? "Not available yet" : undefined} key={link.label}>{link.label}{"badge" in link && link.badge && <em>{link.badge}</em>}</a>)}</div>)}</div><div className="lp-foot-btm"><span>© {new Date().getFullYear()} {homeCopy.footer.copyrightOwner}</span><span><i />{homeCopy.footer.status}</span><span>{homeCopy.footer.builtWith}</span></div><div className="lp-foot-word" aria-hidden="true">AI Library</div></div></footer>;
}
