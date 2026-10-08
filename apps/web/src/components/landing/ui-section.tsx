import { demoCopy, homeCopy } from "@content/home";

import { LazyDemo } from "./lazy-demo";

export function UISection() {
  return (
    <section className="lp-sec lp-ui-section" id="ui" aria-labelledby="ui-h">
      <div className="lp-wrap">
        <LazyDemo name="ui">
          <h2 className="lp-h2" id="ui-h">{homeCopy.ui.title} <em>{homeCopy.ui.accent}</em></h2>
          <p className="lp-sub">{homeCopy.ui.description}</p>
        </LazyDemo>
        <div className="lp-cats">
          {demoCopy.ui.categories.map(([count, title, category], index) => <a className={`lp-cat ${index === demoCopy.ui.categories.length - 1 ? "is-blk" : ""}`} href={`/ui?category=${category}`} key={category}><b>{count}</b><span>{title}</span></a>)}
        </div>
      </div>
    </section>
  );
}
