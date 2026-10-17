import { homeCopy } from "@content/home";
import { BrandMark } from "@/components/brand-mark";
import { CopyButton } from "./copy-button";
import { Icon } from "./parts";

export function ClosingSection() {
  const copy = homeCopy.closing;
  const command = copy.command;
  return <section className="lp-cta" aria-labelledby="cta-h"><div className="lp-wrap"><BrandMark className="lp-cta-mark" /><h2 id="cta-h">{copy.title} <em>{copy.accent}</em></h2><p>{copy.description}</p><div className="lp-cta-b"><a className="lp-btn lp-btn-p lp-btn-lg" href="/kits">Browse kits <Icon name="arrow" /></a><a className="lp-btn lp-btn-g lp-btn-lg" href="/workflows?access=free">Get a free item</a></div><div className="lp-cta-cmd"><b>$</b><span>{command}</span><CopyButton text={command} /></div></div></section>;
}
