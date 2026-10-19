import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, mkdtemp, rm, copyFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { documentSpecs } from "./documents.js";
import type { DocumentSpec, MediaManifest } from "./types.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
const fixedDate = new Date("2026-10-20T12:00:00Z");

function wrap(text: string, measure: (value: string) => number, width: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    const next = current ? `${current} ${word}` : word;
    if (current && measure(next) > width) { lines.push(current); current = word; }
    else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

async function makePdf(spec: DocumentSpec, fontBytes: Uint8Array): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  pdf.setCreationDate(fixedDate); pdf.setModificationDate(fixedDate);
  pdf.setProducer("AI Library Fieldline seed 1.0.0"); pdf.setCreator("AI Library");
  pdf.setTitle(`${spec.recordType} ${spec.id}`); pdf.setAuthor("Fieldline fictional fixtures");
  const font = await pdf.embedFont(fontBytes, { subset: true });
  const page = pdf.addPage([612, 792]);
  const ink = rgb(0.08, 0.08, 0.1); const muted = rgb(0.35, 0.35, 0.39);
  page.drawText(spec.text[0] ?? "FICTIONAL FIXTURE", { x: 44, y: 748, size: 8, font, color: muted });
  page.drawText(spec.text[1] ?? spec.recordType.toUpperCase(), { x: 44, y: 704, size: 23, font, color: ink });
  page.drawLine({ start: { x: 44, y: 685 }, end: { x: 568, y: 685 }, thickness: 0.6, color: rgb(0.78, 0.78, 0.8) });
  let y = 655;
  for (const text of spec.text.slice(2)) {
    const total = text.startsWith("Total:");
    const size = total ? 15 : 10.5;
    for (const line of wrap(text, (value) => font.widthOfTextAtSize(value, size), 520)) {
      if (y < 90) throw new Error(`Document overflow: ${spec.filename}`);
      page.drawText(line, { x: 44, y, size, font, color: ink });
      y -= total ? 25 : 18;
    }
    y -= 7;
  }
  page.drawLine({ start: { x: 44, y: 66 }, end: { x: 568, y: 66 }, thickness: 0.5, color: rgb(0.78, 0.78, 0.8) });
  page.drawText(`${spec.id}  /  Synthetic test data  /  1 of 1`, { x: 44, y: 47, size: 8, font, color: muted });
  return pdf.save({ useObjectStreams: false });
}

function parsePgm(bytes: Buffer): { width: number; height: number; pixels: Buffer } {
  let offset = 0;
  function token(): string {
    while (offset < bytes.length) {
      if (bytes[offset] === 35) { while (offset < bytes.length && bytes[offset] !== 10) offset++; }
      else if ((bytes[offset] ?? 0) <= 32) offset++;
      else break;
    }
    const start = offset;
    while (offset < bytes.length && (bytes[offset] ?? 0) > 32) offset++;
    return bytes.subarray(start, offset).toString("ascii");
  }
  if (token() !== "P5") throw new Error("Expected binary grayscale PGM");
  const width = Number(token()); const height = Number(token());
  if (token() !== "255") throw new Error("Expected 8-bit grayscale PGM");
  if (bytes[offset] === 13 && bytes[offset + 1] === 10) offset += 2;
  else offset++;
  const pixels = bytes.subarray(offset);
  if (pixels.length !== width * height) throw new Error("Truncated document raster");
  return { width, height, pixels };
}

// A tiny deterministic grayscale PNG writer avoids OS-specific image metadata.
function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function pngChunk(type: string, data: Buffer): Buffer {
  const name = Buffer.from(type, "ascii");
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}
function makePng(width: number, height: number, pixels: Buffer, degraded: boolean): Buffer {
  const scanlines = Buffer.alloc(height * (width + 1));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const original = pixels[y * width + x] ?? 255;
      // Reduced resolution, faded toner, banding and deterministic paper noise.
      const value = degraded ? Math.min(255, Math.max(0, Math.round(145 + original * 0.4 + ((x * 13 + y * 7) % 13) - 6 + (y % 29 < 2 ? 13 : 0)))) : original;
      scanlines[y * (width + 1) + x + 1] = value;
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pngChunk("IHDR", header), pngChunk("IDAT", deflateSync(scanlines, { level: 9 })), pngChunk("IEND", Buffer.alloc(0))]);
}

/** Regenerate the frozen document corpus. Ordinary builders copy these bytes. */
export async function renderMedia(output = resolve(root, "assets")): Promise<MediaManifest> {
  const fontPath = resolve(root, "recipe/fonts/BricolageGrotesque-Regular.ttf");
  const fontBytes = await readFile(fontPath);
  const work = await mkdtemp(join(tmpdir(), "fieldline-pdf-"));
  const media: MediaManifest = {};
  await mkdir(resolve(output, "documents"), { recursive: true });
  await mkdir(resolve(output, "previews"), { recursive: true });
  try {
    for (const spec of documentSpecs()) {
      const target = resolve(output, "documents", spec.filename);
      const previewName = `${spec.id}.png`;
      const previewPath = resolve(output, "previews", previewName);
      if (spec.duplicateOf) {
        const original = media[spec.duplicateOf];
        if (!original) throw new Error(`Missing duplicate source ${spec.duplicateOf}`);
        await copyFile(resolve(output, "documents", spec.duplicateOf), target);
        await copyFile(resolve(output, String(original.preview)), previewPath);
      } else {
        const pdf = await makePdf(spec, fontBytes);
        const temporaryPdf = join(work, "page.pdf"); const rasterPrefix = join(work, "page");
        await writeFile(temporaryPdf, pdf);
        const render = spawnSync(process.env.KITS_PDFTOPPM ?? "pdftoppm", ["-f", "1", "-singlefile", "-r", spec.degraded ? "48" : "96", "-gray", temporaryPdf, rasterPrefix], { encoding: "utf8", timeout: 20_000 });
        if (render.error || render.status !== 0) throw new Error(`PDF rasterizer failed; install Poppler or set KITS_PDFTOPPM. ${render.error?.message ?? render.stderr}`);
        const { width, height, pixels } = parsePgm(await readFile(`${rasterPrefix}.pgm`));
        const png = makePng(width, height, pixels, spec.degraded);
        await writeFile(previewPath, png);
        await writeFile(target, spec.kind === "pdf" ? pdf : png);
      }
      const bytes = await readFile(target); const preview = await readFile(previewPath);
      media[spec.filename] = { sha256: sha256(bytes), size: bytes.length, mediaType: spec.kind === "pdf" ? "application/pdf" : "image/png", degraded: spec.degraded,
        preview: `previews/${previewName}`, previewSha256: sha256(preview) };
    }
    await writeFile(resolve(output, "manifest.json"), `${JSON.stringify(media, null, 2)}\n`);
    for (const name of await readdir(resolve(output, "documents"))) {
      if (/^(invoice|contract)-[0-9]{3}\.(pdf|png)$/.test(name) && !Object.hasOwn(media, name)) await rm(resolve(output, "documents", name));
    }
    return media;
  } finally { await rm(work, { recursive: true, force: true }); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv[2] ? resolve(process.argv[2]) : undefined;
  const manifest = await renderMedia(output);
  console.log(`Rendered ${Object.keys(manifest).length} canonical documents and previews.`);
}
