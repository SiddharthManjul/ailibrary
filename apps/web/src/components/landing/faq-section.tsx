import { homeCopy } from "@content/home";
import { LazyDemo } from "./lazy-demo";

export function FAQSection() {
  const copy = homeCopy.faq;
  return <section className="lp-sec" id="faq" aria-labelledby="fq-h"><div className="lp-wrap"><div className="lp-faq"><div><div className="lp-head"><h2 className="lp-h2" id="fq-h">{copy.title} <em>{copy.accent}</em></h2></div><p className="lp-faq-ask">{copy.contactText.before} <a href="/contact">{copy.contactText.label}</a>. {copy.contactText.after}</p></div><LazyDemo name="faq" /></div></div></section>;
}
