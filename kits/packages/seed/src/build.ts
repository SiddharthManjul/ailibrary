import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import { readFile, writeFile, readdir, mkdir, lstat, mkdtemp, rename, rm, realpath } from "node:fs/promises";
import { dirname, resolve, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { RecordName } from "@ai-library/contracts";
import { generateDataset } from "./generator.js";
import { buildLoadPlan, stableJson, toCsv } from "./load.js";
import { DEFAULT_SEED } from "./random.js";
import { SERVICE_SOURCE } from "./service.js";
import { validateDataset } from "./validate.js";
import type { MediaManifest, PlantedCase, SeedDataset } from "./types.js";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const canonicalJson = (value: unknown) => `${JSON.stringify(JSON.parse(stableJson(value)) as unknown, null, 2)}\n`;
export const sha256 = (value: Uint8Array) => createHash("sha256").update(value).digest("hex");
const bytes = (value: string) => Buffer.from(value, "utf8");
const terminalNewline = (text: string) => `${text.trimEnd()}\n`;
export function plantedMarkdown(entries: PlantedCase[]): string {
  return "# Fieldline planted cases\n\nSynthetic eval truth. Source: `planted.json`.\n\n" + entries.map((entry) =>
    `## ${entry.id}\n\n- Kind: \`${entry.kind}\`\n- Record type: \`${entry.recordType}\`\n- Records: ${entry.recordIds.map((id) => `\`${id}\``).join(", ")}\n\n${entry.description}\n\nExpected: ${entry.expected}\n`).join("\n");
}
export async function loadMediaManifest(): Promise<MediaManifest> {
  return JSON.parse(await readFile(resolve(packageRoot, "assets/manifest.json"), "utf8")) as MediaManifest;
}
export async function artifactFiles(dataset: SeedDataset): Promise<Map<string, Uint8Array>> {
  validateDataset(dataset, true);
  const media = await loadMediaManifest();
  const files = new Map<string, Uint8Array>();
  files.set("dataset.json", bytes(canonicalJson(dataset)));
  for (const [path, value] of Object.entries({ "company.json": dataset.company, "people.json": dataset.people, "engineering-context.json": dataset.engineeringContext,
    "planted.json": dataset.planted, "media-manifest.json": media })) files.set(path, bytes(canonicalJson(value)));
  files.set("PLANTED.md", bytes(plantedMarkdown(dataset.planted)));
  for (const [name, records] of Object.entries(dataset.records)) files.set(`data/${name}.json`, bytes(canonicalJson(records)));
  const plan = buildLoadPlan(dataset.records, "sheets");
  for (const table of plan.tables) files.set(`csv/${table.record}.csv`, bytes(toCsv(table.columns, table.rows)));
  for (const article of dataset.knowledgeBase) files.set(`kb/${article.id}.md`, bytes(terminalNewline(article.body)));
  for (const pr of dataset.pullRequests) files.set(`patches/${pr.id}.patch`, bytes(terminalNewline(pr.patch)));
  files.set("service/src/maintenance.ts", bytes(SERVICE_SOURCE));
  files.set("service/tsconfig.json", bytes('{"compilerOptions":{"target":"ES2023","module":"ESNext","strict":true,"noUncheckedIndexedAccess":true,"noEmit":true},"include":["src/**/*.ts"]}\n'));
  for (const [filename, entry] of Object.entries(media)) {
    assert.ok(/^(invoice|contract)-[0-9]{3}\.(pdf|png)$/.test(filename), "Unsafe media filename");
    const value = await readFile(resolve(packageRoot, "assets/documents", filename));
    assert.equal(sha256(value), entry.sha256, `Document hash mismatch: ${filename}`);
    assert.equal(value.length, entry.size, `Document size mismatch: ${filename}`);
    assert.ok(filename.endsWith(".pdf") ? value.subarray(0, 5).toString("ascii") === "%PDF-" : value.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])), `Document suffix/content mismatch ${filename}`);
    const invoice = dataset.records.Invoice.find((row) => row.file.name === filename);
    if (invoice) assert.equal(invoice.file.sha256, entry.sha256);
    files.set(`documents/${filename}`, value);
    assert.ok(typeof entry.preview === "string" && /^previews\/(invoice|contract)-[0-9]{3}\.png$/.test(entry.preview), "Unsafe preview path");
    const preview = await readFile(resolve(packageRoot, "assets", entry.preview));
    assert.equal(sha256(preview), entry.previewSha256, `Preview hash mismatch ${filename}`);
    files.set(entry.preview, preview);
  }
  assert.equal(Object.keys(media).length, 138, "Expected 120 invoice/receipt and 18 contract documents");
  const manifest = { schemaVersion: 1, seed: dataset.seed, recipeVersion: dataset.recipeVersion, referenceDate: dataset.referenceDate,
    counts: Object.fromEntries((Object.keys(dataset.records) as RecordName[]).map((name) => [name, dataset.records[name].length])),
    files: Object.fromEntries([...files].map(([path, value]) => [path, { sha256: sha256(value), size: value.length }])) };
  files.set("manifest.json", bytes(canonicalJson(manifest)));
  return files;
}

/** Replace only an owned generated tree; errors leave the previous build intact. */
async function physicalPath(path: string): Promise<string> {
  try { return await realpath(path); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const parent = dirname(path);
    if (parent === path) throw error;
    return resolve(await physicalPath(parent), relative(parent, path));
  }
}
async function outputPaths(folder: string, prefix = ""): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error("Generated output contains a symlink");
    if (entry.isDirectory()) found.push(...await outputPaths(resolve(folder, entry.name), `${prefix}${entry.name}/`));
    else found.push(`${prefix}${entry.name}`);
  }
  return found;
}
export async function buildDataset(output = resolve(packageRoot, "dist"), seed = DEFAULT_SEED): Promise<SeedDataset> {
  const dataset = generateDataset(seed, await loadMediaManifest());
  const files = await artifactFiles(dataset);
  const destination = resolve(output);
  const physicalDestination = await physicalPath(destination);
  const physicalPackage = await realpath(packageRoot);
  const relation = relative(physicalDestination, physicalPackage);
  assert.ok(relation && !(relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation))), "Output cannot contain the seed source package");
  const sourceRelation = relative(physicalPackage, physicalDestination);
  assert.ok(!["src", "recipe", "assets", "python", "scripts", "tests", "node_modules", ".build"].includes(sourceRelation.split(sep)[0] ?? ""), "Output cannot replace seed sources");
  const status = await lstat(destination).catch((error: unknown) => { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; });
  if (status) {
    assert.ok(status.isDirectory() && !status.isSymbolicLink(), "Output must be an owned generated directory");
    const previous = JSON.parse(await readFile(resolve(destination, "manifest.json"), "utf8").catch(() => "null")) as { schemaVersion?: number; files?: Record<string, unknown> } | null;
    assert.equal(previous?.schemaVersion, 1, "Refusing to replace an unrelated output directory");
    await lstat(resolve(destination, "dataset.json"));
    assert.deepEqual((await outputPaths(destination)).sort(), [...Object.keys(previous?.files ?? {}), "manifest.json"].sort(), "Output contains unrelated files; move them before rebuilding");
  }
  await mkdir(dirname(destination), { recursive: true });
  const stage = await mkdtemp(resolve(dirname(destination), ".fieldline-stage-"));
  const backup = `${stage}-previous`;
  let backedUp = false;
  try {
    for (const [path, value] of files) { await mkdir(dirname(resolve(stage, path)), { recursive: true }); await writeFile(resolve(stage, path), value); }
    if (status) { await rename(destination, backup); backedUp = true; }
    try { await rename(stage, destination); }
    catch (error) { if (backedUp) { await rename(backup, destination); backedUp = false; } throw error; }
    if (backedUp) { await rm(backup, { recursive: true }); backedUp = false; }
  } finally { await rm(stage, { recursive: true, force: true }); }
  return dataset;
}

export async function verifyBuild(output = resolve(packageRoot, "dist")): Promise<void> {
  const dataset = JSON.parse(await readFile(resolve(output, "dataset.json"), "utf8")) as SeedDataset;
  const expected = await artifactFiles(dataset);
  assert.deepEqual((await outputPaths(output)).sort(), [...expected.keys()].sort(), "Build file list drift");
  for (const [path, value] of expected) assert.ok((await readFile(resolve(output, path))).equals(value), `Build drift: ${path}`);
}
