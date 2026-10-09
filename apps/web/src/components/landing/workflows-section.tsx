import { demoCopy, homeCopy } from "@content/home";
import { LazyDemo } from "./lazy-demo";
import { ArrowLink, Icon, Trio } from "./parts";

export function WorkflowsSection() {
  return (
    <section className="lp-sec" id="workflows" aria-labelledby="wf-h">
      <div className="lp-wrap">
        <div className="lp-split">
          <div className="lp-split-txt">
            <h2 className="lp-h2" id="wf-h">{homeCopy.workflows.title} <em>{homeCopy.workflows.accent}</em></h2>
            <p className="lp-sub">{homeCopy.workflows.description}</p>
            <div className="lp-ck-h">Every workflow ships with</div>
            <ul className="lp-ck">
              {homeCopy.workflowFeatures.map((feature) => (
                <li key={feature.title}>
                  <span className="lp-ck-i"><Icon name="check" /></span>
                  <div><b>{feature.title}</b><span>{feature.description}</span></div>
                </li>
              ))}
            </ul>
          </div>
          <LazyDemo name="workflow" />
        </div>
        <div className="lp-rail">
          <div className="lp-rail-h"><span>Popular in the catalog</span><ArrowLink href="/workflows">Browse all 60 workflows</ArrowLink></div>
          <div className="lp-wcs">
            {demoCopy.workflowCards.map((card) => (
              <a className="lp-wc" href={`/workflows?kit=${card.kit}`} key={card.kit}>
                <div className="lp-wc-top"><Trio kit={card.kit} /><span>{card.name}</span><span>{card.platforms}</span></div>
                <b className="lp-wc-t">{card.title}</b><p>{card.description}</p>
                <div className="lp-wc-m"><span>{card.apps}</span><span>{card.cost}</span><span>{card.setup}</span></div>
              </a>
            ))}
            <a className="lp-wc is-more" href="/workflows">
              <b>60</b>
              <div><b className="lp-wc-t" style={{ marginTop: 0 }}>workflows, 12 per kit</b><p>{demoCopy.workflowCatalogDescription}</p></div>
              <span className="lp-link">Open the catalog <Icon name="arrow" /></span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
