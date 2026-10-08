import { homeCopy } from "@content/home";
import { LazyDemo } from "./lazy-demo";
import { SectionHeading } from "./parts";

export function TestedSection() {
  return (
    <section className="lp-sec" id="tested" aria-labelledby="tn-h">
      <div className="lp-wrap">
        <SectionHeading id="tn-h" {...homeCopy.tested} action={<div className="lp-night-s"><span className="lp-live"><i />LAST RUN 03:42 UTC</span><span className="lp-sample">Sample data until launch</span></div>} />
        <LazyDemo name="nightly" />
        <div className="lp-gate">
          {homeCopy.qualityGate.map((step, index) => (
            <div className="lp-gt" key={step.title}><div className="lp-gt-l"><span className="lp-gt-d">{index + 1}</span></div><div><b>{step.title}</b><p>{step.description}</p></div></div>
          ))}
        </div>
      </div>
    </section>
  );
}
