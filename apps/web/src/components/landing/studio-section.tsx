import { homeCopy } from "@content/home";
import { Icon } from "./parts";

export function StudioSection() {
  const copy = homeCopy.studio;
  return (
    <section className="lp-sec is-tight" id="studio" aria-labelledby="st-h"><div className="lp-wrap"><div className="lp-st">
      <div><h2 className="lp-h2" id="st-h">{copy.title} <em>{copy.accent}</em></h2><p className="lp-sub">{copy.description}</p><a className="lp-btn lp-btn-p" href="/studio#book-call">Book a call <Icon name="arrow" /></a></div>
      <div className="lp-st-g">{homeCopy.studioOffers.map((offer, index) => <a className="lp-so" href="/studio#book-call" key={offer.title}><span className="lp-so-n">{String(index + 1).padStart(2, "0")}</span><b>{offer.title}</b><p>{offer.description}</p><span>fixed scope</span></a>)}</div>
    </div></div></section>
  );
}
