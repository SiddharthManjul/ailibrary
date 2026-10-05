import { homeCopy } from "@content/home";
import { BrandMark } from "@/components/brand-mark";

export function Footer() {
  return <footer className="lp-foot"><div className="lp-wrap"><div className="lp-foot-g"><div className="lp-foot-b"><a className="al-brand" href="#top" aria-label="AI Library home"><BrandMark className="al-mark" /><span>AI Library</span></a><p>{homeCopy.footer.description}</p></div>{homeCopy.footerColumns.map((column) => <div className="lp-foot-c" key={column.title}><h4>{column.title}</h4>{column.links.map((link) => <a href={link.href} key={link.label}>{link.label}{"badge" in link && link.badge && <em>{link.badge}</em>}</a>)}</div>)}</div><div className="lp-foot-btm"><span>© {new Date().getFullYear()} AI Library</span><span><i />{homeCopy.footer.status}</span><span>{homeCopy.footer.builtWith}</span></div><div className="lp-foot-word" aria-hidden="true">AI Library</div></div></footer>;
}
