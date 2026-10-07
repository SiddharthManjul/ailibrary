import type { ReactNode } from "react";
import { home } from "@content/home";

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  const path = home.icons[name as keyof typeof home.icons] ?? home.icons.arrow;
  return <svg className={`lp-ic ${className}`} viewBox="0 0 24 24" aria-hidden="true"><path d={path} /></svg>;
}

export function Trio({ kit }: { kit: string }) {
  const colors = home.kitColors[kit as keyof typeof home.kitColors] ?? home.kitColors.all;
  return <span className="lp-trio" aria-hidden="true">{colors.map((color, index) => <i key={index} style={{ background: color }} />)}</span>;
}

export function Frame({ title, tag, headerEnd, children, className = "" }: { title: ReactNode; tag?: string; headerEnd?: ReactNode; children: ReactNode; className?: string }) {
  return <div className={`lp-frame ${className}`}><div className="lp-fh"><span className="lp-dots" aria-hidden="true"><i /><i /><i /></span><span>{title}</span><div className="lp-fh-r">{headerEnd}{tag && <span className="lp-tag">{tag}</span>}</div></div>{children}</div>;
}

export function SectionHeading({ id, title, accent, description, action, center = false }: { id: string; title: string; accent?: string; description: string; action?: ReactNode; center?: boolean }) {
  return <div className={`lp-head${center ? " is-c" : ""}`}><div><h2 className="lp-h2" id={id}>{title}{accent && <> <em>{accent}</em></>}</h2>{description && <p className="lp-sub">{description}</p>}</div>{action && <div className="lp-head-a">{action}</div>}</div>;
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return <a className="lp-link" href={href}>{children}<Icon name="arrow" /></a>;
}
