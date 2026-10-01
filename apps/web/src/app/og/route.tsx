import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";
import { landingDescription } from "@/components/landing/structured-data";

const font = readFile(join(process.cwd(), "src/assets/fonts/BricolageGrotesque-Regular.ttf"));

export async function GET(request: Request) {
  const light = new URL(request.url).searchParams.get("theme") === "light";
  const background = light ? "#F6F6F3" : "#09090B";
  const foreground = light ? "#0D0D0F" : "#F4F4F2";
  const muted = light ? "#55555E" : "#A1A1AA";
  const purple = light ? "#6D28D9" : "#9B7BFF";
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: background, color: foreground, padding: "48px 72px", fontFamily: "Bricolage Grotesque" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 30 }}><BrandMark width={52} height={52} style={{ color: foreground }} /><span>AI Library</span></div>
      <div style={{ display: "flex", flexDirection: "column", marginTop: 32, fontSize: 78, letterSpacing: "-3px", lineHeight: 1.02 }}><span>The AI kit your</span><span style={{ color: purple }}>whole business</span><span>can run on</span></div>
      <div style={{ display: "flex", marginTop: 24, maxWidth: 900, color: muted, fontSize: 24, lineHeight: 1.35 }}>{landingDescription}</div>
    </div>,
    { width: 1200, height: 630, fonts: [{ name: "Bricolage Grotesque", data: await font, weight: 400, style: "normal" }], headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}
