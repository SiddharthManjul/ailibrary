import { homeCopy } from "@content/home";

import { LazyDemo } from "./lazy-demo";
import { ArrowLink, SectionHeading } from "./parts";

export function KitsSection() {
  return (
    <section className="lp-sec" id="kits" aria-labelledby="kits-h">
      <div className="lp-wrap">
        <SectionHeading
          id="kits-h"
          {...homeCopy.kits}
          action={<ArrowLink href="/kits">Compare all five kits</ArrowLink>}
        />
        <LazyDemo name="kits" />
      </div>
    </section>
  );
}
