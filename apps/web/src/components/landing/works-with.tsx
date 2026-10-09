import { home } from "@content/home";

export function WorksWith() {
  return <section className="lp-works" aria-label="Works with your existing tools"><div className="lp-works-l">Works with <b>the tools you already use</b></div><div className="lp-mq"><div className="lp-mq-t">{[false, true].map((duplicate) => <div className="lp-mq-group" aria-hidden={duplicate || undefined} key={String(duplicate)}>{home.worksWith.map((name) => <span className="lp-mq-i" key={name}><i aria-hidden="true" /><span className="lp-mq-n">{name}</span></span>)}</div>)}</div></div></section>;
}
