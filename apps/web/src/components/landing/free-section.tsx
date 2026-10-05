import { homeCopy } from "@content/home";
import { LazyDemo } from "./lazy-demo";
import { ArrowLink, SectionHeading } from "./parts";

export function FreeSection() {
  return <section className="lp-sec" id="free" aria-labelledby="fr-h"><div className="lp-wrap"><SectionHeading id="fr-h" {...homeCopy.free} action={<ArrowLink href="/free">All free items</ArrowLink>} /><LazyDemo name="free" /></div></section>;
}
