import type { CSSProperties } from "react";

/** Design accents affect selection and progress. Status colors remain independent. */
export const designAccentPresets = {
  violet: "#8B5CF6",
  indigo: "#6265F0",
  blue: "#3B82F6",
  teal: "#14B8A6",
  amber: "#F59E0B",
  orange: "#F97316",
  rose: "#F43F5E",
} as const;

export type DesignAccent = "mono" | keyof typeof designAccentPresets | `#${string}`;
export type DesignAccentStyle = CSSProperties & {
  "--primary": string;
  "--primary-foreground": string;
};

const darkInk = "#0B0B0E";
const lightInk = "#FFFFFF";

function normalizeHex(value: string): string {
  if (/^#[\da-f]{3}$/iu.test(value)) {
    return `#${[...value.slice(1)].map((digit) => `${digit}${digit}`).join("")}`.toUpperCase();
  }
  if (/^#[\da-f]{6}$/iu.test(value)) return value.toUpperCase();
  throw new TypeError("A design accent must be a preset, #RGB or #RRGGBB color.");
}

function luminance(hex: string): number {
  const values = [1, 3, 5].map((offset) => {
    const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (values[0] ?? 0) * 0.2126 + (values[1] ?? 0) * 0.7152 + (values[2] ?? 0) * 0.0722;
}

function contrast(first: number, second: number): number {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Choose the higher WCAG contrast of the design's two button foregrounds. */
export function getDesignAccentForeground(hex: `#${string}`): typeof darkInk | typeof lightInk {
  const background = luminance(normalizeHex(hex));
  return contrast(background, luminance(darkInk)) >= contrast(background, luminance(lightInk)) ? darkInk : lightInk;
}

/** Apply to the same element as data-ui-design. Mono follows the existing root theme. */
export function getDesignAccentStyle(accent: DesignAccent): DesignAccentStyle {
  if (accent === "mono") {
    return { "--primary": "var(--ui-mono-primary)", "--primary-foreground": "var(--ui-mono-primary-foreground)" };
  }
  const color = normalizeHex(accent in designAccentPresets ? designAccentPresets[accent as keyof typeof designAccentPresets] : accent);
  return { "--primary": color, "--primary-foreground": getDesignAccentForeground(color as `#${string}`) };
}
