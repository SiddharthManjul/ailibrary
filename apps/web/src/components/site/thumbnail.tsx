export type ThumbnailData = {
  variant: string;
  bars: readonly number[];
  w1: number;
  w2: number;
  w3: number;
};

export function Thumbnail({ thumbnail }: { thumbnail: ThumbnailData }) {
  const { variant, bars, w1, w2, w3 } = thumbnail;
  let preview;

  switch (variant) {
    case "c-ai-interaction":
      preview = <div className="pv-chat"><i className="pv-bub is-u" style={{ width: `${w2}%` }} /><i className="pv-bub" style={{ width: `${w3}%` }} /><i className="pv-bub" style={{ width: `${w1}%` }} /><span className="pv-inp"><i /></span></div>;
      break;
    case "c-agent-control":
      preview = <div className="pv-appr"><span className="pv-ah"><i /><b style={{ width: `${w2}%` }} /></span><b className="pv-at" style={{ width: `${w3}%` }} /><b className="pv-al" style={{ width: `${w1}%` }} /><span className="pv-ab"><i /><i className="is-p" /></span></div>;
      break;
    case "c-data-display":
      preview = <div className="pv-chart">{bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>;
      break;
    case "c-inputs":
      preview = <div className="pv-input"><span className="pv-field"><b style={{ width: `${w1}%` }} /><i /></span><span className="pv-chips"><i /><i /><i className="is-p" /></span></div>;
      break;
    case "c-shell":
    case "b-app-shell":
      preview = <div className="pv-shell"><span className="pv-side"><i /><i className="is-p" /><i /><i /></span><span className="pv-main"><b style={{ width: `${w2}%` }} /><i /><i /></span></div>;
      break;
    case "c-workflow":
      preview = <div className="pv-flow"><i className="is-p" /><b /><i /><b /><i /></div>;
      break;
    case "b-landing":
      preview = <div className="pv-hero"><span className="pv-hl"><b style={{ width: `${w3}%` }} /><b style={{ width: `${w1}%` }} /><i /><em /></span><span className="pv-hr" /></div>;
      break;
    case "b-crm":
      preview = <div className="pv-table"><span className="is-h" />{[w2, w3, w1, w2].map((width, index) => <span key={index}><i /><b style={{ width: `${width}%` }} /><em /></span>)}</div>;
      break;
    case "b-dashboards":
      preview = <div className="pv-dash"><span className="pv-kpis"><i /><i /><i /></span><span className="pv-area">{bars.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</span></div>;
      break;
    case "b-analytics":
      preview = <div className="pv-funnel">{[100, w3, w2, 24].map((width, index) => <i key={index} style={{ width: `${width}%` }} />)}</div>;
      break;
    case "b-agent-apps":
      preview = <div className="pv-inbox">{[0, 1, 2].map((index) => <span key={index}><i /><b /><em /></span>)}</div>;
      break;
    default:
      preview = <div className="pv-flow"><i className="is-p" /><b /><i /><b /><i /></div>;
  }

  return <div className="st-pv" aria-hidden="true">{preview}</div>;
}
