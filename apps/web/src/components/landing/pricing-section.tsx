import { homeCopy } from "@content/home";
import { LazyDemo } from "./lazy-demo";
import { Icon, SectionHeading } from "./parts";

export function PricingSection() {
  return (
    <section className="lp-sec" id="pricing" aria-labelledby="pr-h">
      <div className="lp-wrap">
        <SectionHeading id="pr-h" {...homeCopy.pricing} center />
        <LazyDemo name="pricing" />
        <div className="lp-pr-note">{homeCopy.pricing.notes.map((note) => <span key={note.text}><Icon name={note.icon} />{note.text}</span>)}</div>
      </div>
    </section>
  );
}
