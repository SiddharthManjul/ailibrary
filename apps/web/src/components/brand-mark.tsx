import type { SVGProps } from "react";

export function BrandMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <g stroke="currentColor" strokeWidth={6} strokeLinecap="round">
        <line x1={58} y1={30.68} x2={64} y2={20.29} />
        <line x1={65.32} y1={38} x2={79.18} y2={30} />
        <line x1={68} y1={48} x2={90} y2={48} />
        <line x1={65.32} y1={58} x2={79.18} y2={66} />
        <line x1={58} y1={65.32} x2={64} y2={75.71} />
        <line x1={48} y1={68} x2={48} y2={90} />
        <line x1={38} y1={65.32} x2={32} y2={75.71} />
        <line x1={30.68} y1={58} x2={16.82} y2={66} />
        <line x1={28} y1={48} x2={6} y2={48} />
        <line x1={30.68} y1={38} x2={16.82} y2={30} />
        <line x1={38} y1={30.68} x2={32} y2={20.29} />
        <line x1={48} y1={28} x2={48} y2={6} />
      </g>
      <circle cx={48} cy={48} r={6} fill="currentColor" stroke="none" />
    </svg>
  );
}
