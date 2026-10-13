import localFont from "next/font/local";

import "../assets/fonts/fallback.css";

const vietnamese = localFont({
  src: "../assets/fonts/BricolageGrotesque-Vietnamese.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Bricolage Grotesque Fallback"],
  declarations: [
    { prop: "font-family", value: "BricolageGrotesque" },
    { prop: "font-stretch", value: "100%" },
    { prop: "unicode-range", value: "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB" },
  ],
});

const latinExtended = localFont({
  src: "../assets/fonts/BricolageGrotesque-LatinExtended.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Bricolage Grotesque Fallback"],
  declarations: [
    { prop: "font-family", value: "BricolageGrotesque" },
    { prop: "font-stretch", value: "100%" },
    { prop: "unicode-range", value: "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF" },
  ],
});

const latin = localFont({
  src: "../assets/fonts/BricolageGrotesque-Latin.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["Bricolage Grotesque Fallback"],
  declarations: [
    { prop: "font-family", value: "BricolageGrotesque" },
    { prop: "font-stretch", value: "100%" },
    { prop: "unicode-range", value: "U+0000-001F,U+007F-00A8,U+00AA-00B6,U+00B8-00D6,U+00D8-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-2025,U+2027-206F,U+20AC,U+2122,U+2191,U+2193,U+2215,U+FEFF,U+FFFD" },
  ],
});

const BricolageGrotesque = localFont({
  src: "../assets/fonts/BricolageGrotesque-Critical.woff2",
  weight: "200 800",
  style: "normal",
  display: "swap",
  preload: true,
  adjustFontFallback: false,
  fallback: ["Bricolage Grotesque Fallback"],
  variable: "--font-bricolage-grotesque",
  declarations: [
    { prop: "font-family", value: "BricolageGrotesque" },
    { prop: "font-stretch", value: "100%" },
    { prop: "unicode-range", value: "U+0020-007E,U+00A9,U+00B7,U+00D7,U+2026,U+2212" },
  ],
});

export const display = {
  ...BricolageGrotesque,
  variable: `${BricolageGrotesque.variable} ${latin.className} ${latinExtended.className} ${vietnamese.className}`,
};
