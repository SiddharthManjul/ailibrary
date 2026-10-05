import { homeCopy } from "@content/home";
import { LazyDemo } from "./lazy-demo";
import { Icon, SectionHeading } from "./parts";

export function InstallSection() {
  const copy = homeCopy.install;
  return (
    <section className="lp-sec" id="install" aria-labelledby="in-h">
      <div className="lp-wrap">
        <SectionHeading id="in-h" {...copy} />
        <LazyDemo name="terminal" />
        <div className="lp-tools">
          <span>Works in</span>
          {copy.tools.map((tool) => (
            <span className="lp-tool-c" key={tool}><i />{tool}</span>
          ))}
        </div>
        <div className="lp-ways">
          {homeCopy.installCards.map((card) => (
            <div className="lp-way" key={card.title}>
              <span className="lp-way-i"><Icon name={card.icon} /></span>
              <b>{card.title}</b><p>{card.description}</p><code>{card.command}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
