import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDataset, verifyBuild, canonicalJson, packageRoot } from "./build.js";
import { DEFAULT_SEED } from "./random.js";
import { buildLoadPlan, type LoadTarget } from "./load.js";
import { validateDataset } from "./validate.js";
import type { SeedDataset } from "./types.js";

export async function main(args = process.argv.slice(2)): Promise<void> {
  const command = args.shift();
  const values = new Map<string, string>();
  let apply = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    if (arg === "--apply") { if (apply) throw new Error("Repeated --apply"); apply = true; continue; }
    if (!arg || !["--output", "--seed", "--target", "--input", "--database-env"].includes(arg) || values.has(arg)) throw new Error(`Unknown or duplicate option ${arg ?? ""}`);
    const value = args[++index];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
    values.set(arg, value);
  }
  if (command === "build") {
    if (apply || [...values.keys()].some((key) => !["--output", "--seed"].includes(key))) throw new Error("build accepts --seed and --output only");
    const raw = values.get("--seed");
    if (raw && !/^(0|[1-9][0-9]*)$/.test(raw)) throw new Error("Seed must be an unsigned 32-bit integer");
    const seed = raw === undefined ? DEFAULT_SEED : Number(raw);
    const dataset = await buildDataset(values.get("--output"), seed);
    console.log(`Built Fieldline seed ${dataset.seed}: 5816 records, 138 documents, 45 KB articles, 80 PR patches, ${dataset.planted.length} planted cases.`);
  } else if (command === "check") {
    if (apply || [...values.keys()].some((key) => key !== "--input")) throw new Error("check accepts --input only");
    await verifyBuild(values.get("--input")); console.log("Fieldline output and all artifact hashes verified.");
  } else if (command === "load") {
    if (values.has("--seed")) throw new Error("Load an existing build; --seed belongs to build");
    const target = values.get("--target");
    if (!["postgres", "sheets", "n8n-datatables"].includes(target ?? "")) throw new Error("load requires --target postgres|sheets|n8n-datatables");
    const input = resolve(values.get("--input") ?? resolve(packageRoot, "dist"));
    await verifyBuild(input);
    const dataset = JSON.parse(await readFile(resolve(input, "dataset.json"), "utf8")) as SeedDataset;
    validateDataset(dataset, true);
    const plan = buildLoadPlan(dataset.records, target as LoadTarget);
    if (apply) {
      if (target !== "postgres" || plan.target !== "postgres") throw new Error("Remote Sheets/n8n writes use the documented SDK writer interfaces; CLI --apply supports Postgres");
      if (values.has("--output")) throw new Error("Choose either --output or --apply");
      const name = values.get("--database-env");
      if (!name || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || !process.env[name]) throw new Error("--apply requires --database-env naming an environment variable containing a Postgres DSN");
      // Keep DSNs out of command arguments and generated files.
      const result = spawnSync("psql", ["-X", "-v", "ON_ERROR_STOP=1"], { env: { ...process.env, PGDATABASE: process.env[name] }, input: plan.sql, encoding: "utf8", timeout: 120_000, maxBuffer: 4 * 1024 * 1024 });
      if (result.error || result.status !== 0) throw new Error("Postgres seed load failed; verify the database connection and apply the F1 kit-store DDL first. The transaction was not committed.");
      console.log(`Loaded ${plan.recordCount} records into the selected Postgres kit store.`);
    } else {
      if (values.has("--database-env")) throw new Error("--database-env requires --apply");
      const content = plan.target === "postgres" ? plan.sql : canonicalJson(plan);
      const output = values.get("--output");
      if (output) { await writeFile(resolve(output), content, { flag: "wx" }); console.log(`Wrote ${target} import plan for ${plan.recordCount} records.`); }
      else process.stdout.write(content);
    }
  } else throw new Error("Usage: build [--seed N] [--output DIR] | check [--input DIR] | load --target postgres|sheets|n8n-datatables [--input DIR] [--output FILE] [--apply --database-env NAME]");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { await main(); } catch (error) { console.error(error instanceof Error ? error.message : "Seed command failed"); process.exitCode = 1; }
}
