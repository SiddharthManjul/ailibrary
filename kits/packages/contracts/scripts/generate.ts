import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname, relative } from "node:path";
import { z } from "zod";
import { recordSchemas, type RecordName } from "../src/index.js";
import { recordFixtures } from "../src/fixtures.js";
import { columns, toSnakeCase } from "../src/columns.js";

// Runs from dist/scripts after tsc. Every output is deterministic.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const check = process.argv.includes("--check");
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
type Schema = {
  type?: string | string[];
  properties?: Record<string, Schema>;
  required?: string[];
  additionalProperties?: Schema | boolean;
  items?: Schema;
  enum?: (string | number | boolean | null)[];
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  minLength?: number;
  anyOf?: Schema[];
  $ref?: string;
};
type ForeignKey = { record: RecordName; field: string; target: RecordName };
const foreignKeys: ForeignKey[] = [
  { record: "Deal", field: "accountId", target: "Account" },
  { record: "DraftReply", field: "ticketId", target: "Ticket" },
  { record: "QaScore", field: "ticketId", target: "Ticket" },
  { record: "ChurnSignal", field: "accountId", target: "Account" },
  { record: "ContentItem", field: "approval", target: "Approval" },
  { record: "DraftReply", field: "approval", target: "Approval" },
];
const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
const table = (name: string) => `"ai_library_kits".${quote(toSnakeCase(name).replace(/^_/, ""))}`;
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

function sqlType(schema: Schema): string {
  if (schema.type === "boolean") return "boolean";
  if (schema.type === "integer") return "bigint";
  if (schema.type === "number") return "numeric";
  if (schema.type === "string" && schema.format === "date-time") return "timestamptz";
  if (schema.type === "string" && schema.format === "date") return "date";
  if (schema.type === "string") return "text";
  return "jsonb";
}

function sqlColumn(field: string, schema: Schema, required: boolean): string {
  const column = quote(toSnakeCase(field));
  const type = sqlType(schema);
  const constraints: string[] = [];
  if (field === "id") constraints.push("PRIMARY KEY");
  else if (required) constraints.push("NOT NULL");
  if (schema.enum && type === "text") constraints.push(`CHECK (${column} IN (${schema.enum.map((value) => literal(String(value))).join(", ")}))`);
  if (schema.minLength !== undefined && type === "text") constraints.push(`CHECK (char_length(${column}) >= ${schema.minLength})`);
  for (const [key, op] of [["minimum", ">="], ["maximum", "<="], ["exclusiveMinimum", ">"], ["exclusiveMaximum", "<"]] as const) {
    if (schema[key] !== undefined) constraints.push(`CHECK (${column} ${op} ${schema[key]})`);
  }
  return `  ${column} ${type}${constraints.length ? ` ${constraints.join(" ")}` : ""}`;
}

function makeSql(schemas: Record<string, Schema>): string {
  const lines = ["-- Generated from Zod. Do not edit. Run pnpm contracts:generate.",
    "-- Initial buyer-owned kit-store schema; unrelated to the platform database.",
    "-- Validate records with the contracts before INSERT (JSONB constraints stay in JSON Schema).",
    "BEGIN;", 'CREATE SCHEMA IF NOT EXISTS "ai_library_kits";', ""];
  for (const [name, schema] of Object.entries(schemas)) {
    lines.push(`CREATE TABLE ${table(name)} (`, Object.entries(schema.properties ?? {}).map(([field, value]) =>
      sqlColumn(field, value, schema.required?.includes(field) ?? false)).join(",\n"), ");",
      `CREATE INDEX ${quote(`${toSnakeCase(name).replace(/^_/, "")}_created_at_idx`)} ON ${table(name)} ("created_at");`, "");
  }
  for (const { record, field, target } of foreignKeys) {
    const column = toSnakeCase(field);
    const prefix = `${toSnakeCase(record).replace(/^_/, "")}_${column}`;
    lines.push(`ALTER TABLE ${table(record)} ADD CONSTRAINT ${quote(`${prefix}_fk`)} FOREIGN KEY (${quote(column)}) REFERENCES ${table(target)} ("id") DEFERRABLE INITIALLY DEFERRED;`,
      `CREATE INDEX ${quote(`${prefix}_idx`)} ON ${table(record)} (${quote(column)});`);
  }
  lines.push(`CREATE INDEX "ticket_customer_account_id_idx" ON ${table("Ticket")} (("customer" ->> 'accountId'));`,
    `CREATE INDEX "activity_subject_idx" ON ${table("Activity")} ("subject_type", "subject_id");`,
    "", "COMMIT;", "");
  return lines.join("\n");
}

function makePythonTypes(schemas: Record<string, Schema>): string {
  const definitions = new Map<string, string>();
  function renderType(schema: Schema, name: string): string {
    if (schema.$ref || schema.anyOf || !schema.type || Array.isArray(schema.type)) return "JsonValue";
    if (schema.enum) return `Literal[${schema.enum.map((value) => JSON.stringify(value)).join(", ")}]`;
    switch (schema.type) {
      case "string": return "str";
      case "integer": return "int";
      case "number": return "float";
      case "boolean": return "bool";
      case "null": return "None";
      case "array": return `list[${renderType(schema.items ?? {}, `${name}Item`)}]`;
      case "object": {
        if (!schema.properties) return `dict[str, ${typeof schema.additionalProperties === "object" ? renderType(schema.additionalProperties, `${name}Value`) : "JsonValue"}]`;
        const fields = Object.entries(schema.properties).map(([field, value]) => {
          const valueType = renderType(value, `${name}${field.charAt(0).toUpperCase()}${field.slice(1)}`);
          return `    ${field}: ${schema.required?.includes(field) ? valueType : `NotRequired[${valueType}]`}`;
        });
        definitions.set(name, `class ${name}(TypedDict):\n${fields.join("\n") || "    pass"}`);
        return name;
      }
      default: throw new Error(`Unsupported JSON Schema type: ${schema.type}`);
    }
  }
  for (const [name, schema] of Object.entries(schemas)) renderType(schema, name);
  return ['"""Generated from Zod JSON Schema. Do not edit; run pnpm contracts:generate."""',
    "from __future__ import annotations", "", "from typing import Literal, NotRequired, TypeAlias, TypedDict", "",
    'JsonValue: TypeAlias = "str | int | float | bool | None | list[JsonValue] | dict[str, JsonValue]"', "",
    ...Array.from(definitions.values()).flatMap((value) => [value, "", ""]),
  ].join("\n");
}

async function writeOrCheck(path: string, content: string) {
  const fullPath = resolve(root, path);
  if (check) {
    if (await readFile(fullPath, "utf8").catch(() => "") !== content) throw new Error(`Generated file drift: ${path}. Run pnpm contracts:generate.`);
  } else {
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }
}

const schemas: Record<string, Schema> = {};
for (const [name, schema] of Object.entries(recordSchemas)) {
  const generated = { ...z.toJSONSchema(schema, { target: "draft-2020-12" }), title: name };
  schemas[name] = generated as Schema;
  await writeOrCheck(`generated/schemas/${name}.json`, json(generated));
  await writeOrCheck(`python/ai_library_contracts/schemas/${name}.json`, json(generated));
}
for (const [name, examples] of Object.entries(recordFixtures)) {
  for (const example of examples) recordSchemas[name as RecordName].parse(example);
}
await writeOrCheck("generated/fixtures.json", json(recordFixtures));
await writeOrCheck("generated/columns.json", json(columns));
await writeOrCheck("python/ai_library_contracts/fixtures.json", json(recordFixtures));
await writeOrCheck("python/ai_library_contracts/types.py", makePythonTypes(schemas));
await writeOrCheck("sql/001-kit-store.sql", makeSql(schemas));
// Fail if deleted contracts leave stale resources behind in either target.
for (const folder of ["generated/schemas", "python/ai_library_contracts/schemas"]) {
  const files = await readdir(resolve(root, folder));
  if (files.some((file) => !Object.hasOwn(schemas, file.replace(/\.json$/, "")))) {
    throw new Error(`Unexpected schema resource in ${relative(root, resolve(root, folder))}; remove stale generated files.`);
  }
}
console.log(`${check ? "Verified" : "Generated"} 25 schemas, 75 fixtures, SQL, column maps and Python types.`);
