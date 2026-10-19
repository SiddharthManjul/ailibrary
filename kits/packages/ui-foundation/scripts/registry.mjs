import assert from "node:assert/strict";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// The host owns the pinned shadcn CLI used by both schema and CLI validation.
const hostRequire = createRequire(resolve(root, "../../../apps/web/package.json"));
const { registrySchema, registryItemSchema } = await import(pathToFileURL(hostRequire.resolve("shadcn/schema")).href);
const registry = registrySchema.parse(JSON.parse(await readFile(resolve(root, "registry.json"), "utf8")));
// Product source is generated for authorized local installation tests. Only the
// seven foundation definitions are included in the public namespace index.
const privateItemRoots = new Map([
  ["sparkline", resolve(root, "../../ui/components/sparkline")],
  ["confidence-badge", resolve(root, "../../ui/components/confidence-badge")],
  ["diff-viewer", resolve(root, "../../ui/components/diff-viewer")],
  ["ui-design-theme", root],
]);
const privateDefinitions = await Promise.all([...privateItemRoots.entries()].map(async ([name, directory]) =>
  registryItemSchema.parse(JSON.parse(await readFile(resolve(directory, name === "ui-design-theme" ? "design-theme.registry.json" : "registry-item.json"), "utf8")))));
const definitions = [...registry.items, ...privateDefinitions];
const css = await readFile(resolve(root, "foundation.css"), "utf8");
const check = process.argv.includes("--check");

function cssVariables(selector) {
  const body = css.split(`${selector} {`)[1]?.split("}")[0];
  assert.ok(body, `Missing theme ${selector}`);
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]));
}

const light = cssVariables(":root");
const dark = { ...light, ...cssVariables(".dark") };
const roles = ["success", "warning", "destructive", "info"];
const theme = Object.fromEntries([
  ...["sans", "display", "mono"].map((family) => [`font-${family}`, "var(--font-bricolage-grotesque, 'Bricolage Grotesque', sans-serif)"]),
  ...roles.flatMap((role) => [[`color-${role}`, `var(--${role})`], [`color-${role}-foreground`, `var(--${role}-foreground)`]]),
  ...Array.from({ length: 6 }, (_, index) => [`color-chart-${index + 1}`, `var(--chart-${index + 1})`]),
]);
const names = new Set(definitions.map((item) => item.name));
assert.equal(names.size, definitions.length, "Registry item names must be unique");
const outputs = new Map();

for (const definition of definitions) {
  for (const dependency of definition.registryDependencies ?? []) {
    if (dependency.startsWith("@ailibrary/")) assert.ok(names.has(dependency.split("/")[1]), `Unresolved dependency: ${dependency}`);
  }
  const item = { $schema: "https://ui.shadcn.com/schema/registry-item.json", ...definition };
  if (item.name === "ui-foundation") item.cssVars = { theme, light, dark };
  item.files = await Promise.all((item.files ?? []).map(async (file) => {
    assert.ok(file.target && !file.target.startsWith("/") && !file.target.includes(".."), "Install targets must stay inside the host");
    assert.ok(!file.target.startsWith("components/ui/"), "Foundation items must compose host primitives");
    const sourceRoot = privateItemRoots.get(item.name) ?? root;
    const sourcePath = resolve(sourceRoot, file.path);
    assert.ok(sourcePath.startsWith(`${sourceRoot}/`), "Source files must stay inside the declared item");
    let content = await readFile(sourcePath, "utf8");
    content = content.replaceAll('"./hooks/use-controllable-state"', '"@/hooks/ailibrary/use-controllable-state"')
      .replaceAll('"../src/hooks/use-controllable-state"', '"@/hooks/ailibrary/use-controllable-state"')
      .replaceAll('"../../../packages/ui-foundation/src/hooks/use-controllable-state"', '"@/hooks/ailibrary/use-controllable-state"')
      .replaceAll('"../../../packages/ui-foundation/src/hooks/use-reduced-motion"', '"@/hooks/ailibrary/use-reduced-motion"')
      .replaceAll('"./diff-model"', '"@/components/ailibrary/diff-model"')
      .replaceAll('"./diff-code"', '"@/components/ailibrary/diff-code"')
      .replaceAll('"./hooks/use-reduced-motion"', '"@/hooks/ailibrary/use-reduced-motion"');
    content = content.replaceAll('"../../../packages/ui-foundation/design-theme.css"', '"./ui-design-theme.css"');
    assert.ok(!/from ["'](?:@ai-library\/|\.\.?\/)/.test(content), `Unresolved source import in ${file.path}`);
    return { ...file, content };
  }));
  registryItemSchema.parse(item);
  outputs.set(`${item.name}.json`, `${JSON.stringify(item, null, 2)}\n`);
}
outputs.set("registry.json", `${JSON.stringify({ $schema: "https://ui.shadcn.com/schema/registry.json", ...registry }, null, 2)}\n`);

const outputDirectory = resolve(root, "registry");
if (!check) await mkdir(outputDirectory, { recursive: true });
for (const [name, content] of outputs) {
  const path = resolve(outputDirectory, name);
  if (check) assert.equal(await readFile(path, "utf8"), content, `Registry drift: ${name}; run pnpm ui:build`);
  else await writeFile(path, content);
}
const actualFiles = (await readdir(outputDirectory)).filter((name) => name.endsWith(".json")).sort();
assert.deepEqual(actualFiles, [...outputs.keys()].sort(), "Remove stale registry artifacts");
console.log(`${check ? "Checked" : "Built"} ${registry.items.length} public registry items, ${privateDefinitions.length} local private item and public index.`);
