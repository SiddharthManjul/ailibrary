import * as contracts from "@ai-library/contracts";
import { recordSchemas, type RecordName } from "@ai-library/contracts";
import { recordColumns, toSnakeCase } from "@ai-library/contracts/columns";

export type LoadRecords = Record<RecordName, readonly unknown[]>;
export type LoadTarget = "postgres" | "sheets" | "n8n-datatables";
export type StoreCell = string | number | boolean | null;
export type StoreRow = Record<string, StoreCell>;
export type LoadTable = { record: RecordName; name: string; columns: string[]; rows: StoreRow[] };
type BasePlan = { format: "ai-library.seed-load.v1"; recordCount: number; tables: LoadTable[] };
export type LoadPlan = BasePlan & (
  | { target: "postgres"; sql: string }
  | { target: "sheets" | "n8n-datatables" }
);

/** Implement with your database client. The SQL includes its own transaction. */
export interface PostgresWriter {
  target: "postgres";
  execute(sql: string): Promise<void>;
}
/** Clear previous cells, then replace the entire tab using RAW input mode. */
export interface SheetsWriter {
  target: "sheets";
  replaceRows(input: {
    sheet: string;
    range: "A1";
    valueInputOption: "RAW";
    values: (string | number | boolean)[][];
  }): Promise<void>;
}
/** Provision the mapped columns, then match existing rows by their `id` field. */
export interface N8nTablesWriter {
  target: "n8n-datatables";
  upsertRows(input: { table: string; columns: string[]; matchColumn: "id"; rows: StoreRow[] }): Promise<void>;
}
export type StoreWriter = PostgresWriter | SheetsWriter | N8nTablesWriter;

type JsonSchema = { type?: unknown; properties?: Record<string, JsonSchema> };
const schemas = contracts as unknown as Record<string, JsonSchema>;
export const recordNames = Object.keys(recordSchemas) as RecordName[];
const scalarTypes = new Set(["string", "integer", "number", "boolean"]);
const quoteIdentifier = (value: string) => `"${value.replaceAll('"', '""')}"`;
const quoteString = (value: string) => `'${value.replaceAll("'", "''")}'`;
const tableName = (name: RecordName) => toSnakeCase(name).replace(/^_/, "");
const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const fieldSchema = (record: RecordName, field: string): JsonSchema => {
  const schema = schemas[`${record}JsonSchema`]?.properties?.[field];
  if (!schema) throw new Error(`Missing F1 schema for ${record}.${field}`);
  return schema;
};
const isJsonColumn = (record: RecordName, field: string) => !scalarTypes.has(String(fieldSchema(record, field).type));

/** Sorted object keys make nested JSON cells portable and deterministic. */
export function stableJson(value: unknown): string {
  function ordered(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(ordered);
    if (input !== null && typeof input === "object") {
      return Object.fromEntries(Object.entries(input).sort(([a], [b]) => compare(a, b)).map(([key, item]) => [key, ordered(item)]));
    }
    return input;
  }
  const result = JSON.stringify(ordered(value));
  if (result === undefined) throw new Error("Expected a JSON value");
  return result;
}

/** Validate the complete batch before any target receives even its first row. */
export function validateSeedRecords(input: LoadRecords): Record<RecordName, Record<string, unknown>[]> {
  if (input === null || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected the complete record dataset");
  const extra = Object.keys(input).filter((name) => !Object.hasOwn(recordSchemas, name));
  if (extra.length) throw new Error(`Unexpected record types: ${extra.join(", ")}`);
  const parsed = {} as Record<RecordName, Record<string, unknown>[]>;
  for (const name of recordNames) {
    if (!Array.isArray(input[name])) throw new Error(`Missing record array: ${name}`);
    const ids = new Set<string>();
    parsed[name] = input[name].map((record, index) => {
      const result = recordSchemas[name].safeParse(record);
      if (!result.success) throw new Error(`Invalid ${name} record at index ${index}: ${result.error.message}`);
      const row = result.data as Record<string, unknown>;
      const id = row.id as string;
      if (ids.has(id)) throw new Error(`Duplicate ${name} id: ${id}`);
      ids.add(id);
      return row;
    }).sort((left, right) => compare(left.id as string, right.id as string));
  }
  // These are the exact deferred foreign keys in the generated F1 kit store.
  const references: readonly [RecordName, string, RecordName][] = [
    ["Deal", "accountId", "Account"], ["DraftReply", "ticketId", "Ticket"],
    ["QaScore", "ticketId", "Ticket"], ["ChurnSignal", "accountId", "Account"],
    ["ContentItem", "approval", "Approval"], ["DraftReply", "approval", "Approval"],
  ];
  for (const [name, field, target] of references) {
    const ids = new Set(parsed[target].map((row) => row.id));
    for (const row of parsed[name]) {
      if (row[field] !== undefined && !ids.has(row[field])) throw new Error(`Dangling ${name}.${field} on ${String(row.id)}`);
    }
  }
  return parsed;
}

function sqlForTables(tables: LoadTable[]): string {
  const lines = ["-- Generated Fieldline seed upserts. Apply F1 sql/001-kit-store.sql first.",
    "BEGIN;", "SET LOCAL standard_conforming_strings = on;", "SET CONSTRAINTS ALL DEFERRED;"];
  for (const table of tables) {
    if (!table.rows.length) continue;
    const fields = Object.keys(recordColumns[table.record]);
    const literals = table.rows.map((row) => `(${fields.map((field) => {
      const column = recordColumns[table.record][field];
      if (!column) throw new Error(`Missing column ${table.record}.${field}`);
      const value = row[column];
      if (value === null) return "NULL";
      if (value === undefined) throw new Error(`Missing value ${table.record}.${field}`);
      if (isJsonColumn(table.record, field)) return `${quoteString(String(value))}::jsonb`;
      if (typeof value === "string") return quoteString(value);
      if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
      if (!Number.isFinite(value)) throw new Error(`Non-finite number ${table.record}.${field}`);
      return String(value);
    }).join(", ")})`);
    const updates = table.columns.filter((column) => column !== "id").map((column) => `${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`);
    lines.push(`INSERT INTO ${quoteIdentifier("ai_library_kits")}.${quoteIdentifier(table.name)} (${table.columns.map(quoteIdentifier).join(", ")}) VALUES`,
      literals.join(",\n"), `ON CONFLICT ("id") DO UPDATE SET ${updates.join(", ")};`);
  }
  lines.push("COMMIT;", "");
  return lines.join("\n");
}

export function buildLoadPlan(records: LoadRecords, target: LoadTarget): LoadPlan {
  if (!["postgres", "sheets", "n8n-datatables"].includes(target)) throw new Error(`Unsupported load target: ${String(target)}`);
  const parsed = validateSeedRecords(records);
  const tables = recordNames.map((record): LoadTable => {
    const fields = Object.keys(recordColumns[record]);
    return {
      record, name: tableName(record), columns: Object.values(recordColumns[record]),
      rows: parsed[record].map((row): StoreRow => Object.fromEntries(fields.map((field) => {
        const column = recordColumns[record][field];
        if (!column) throw new Error(`Missing column ${record}.${field}`);
        const value = row[field];
        return [column, value === undefined ? null : isJsonColumn(record, field) ? stableJson(value) : value as StoreCell];
      }))),
    };
  });
  const base: BasePlan = { format: "ai-library.seed-load.v1", recordCount: tables.reduce((total, table) => total + table.rows.length, 0), tables };
  return target === "postgres" ? { ...base, target, sql: sqlForTables(tables) } : { ...base, target };
}

export function postgresSql(records: LoadRecords): string {
  const plan = buildLoadPlan(records, "postgres");
  if (plan.target !== "postgres") throw new Error("Expected postgres plan");
  return plan.sql;
}

/** RFC 4180 quoting plus spreadsheet formula escaping for text cells. */
export function toCsv(columns: readonly string[], rows: readonly StoreRow[]): string {
  function cell(value: StoreCell): string {
    let text = value === null ? "" : String(value);
    if (typeof value === "string" && (/^[\t\r\n ]*[=+\-@]/.test(text) || /^[\t\r]/.test(text))) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  }
  return [columns.map(cell).join(","), ...rows.map((row) => columns.map((column) => cell(row[column] ?? null)).join(","))].join("\r\n") + "\r\n";
}

/** Revalidate deserialized plans and reject edits before invoking a writer. */
export async function executeLoadPlan(plan: LoadPlan, writer: StoreWriter): Promise<void> {
  if (plan.target !== writer.target) throw new Error("Load plan target and writer target differ");
  const records = Object.fromEntries(recordNames.map((name) => [name, []])) as unknown as Record<RecordName, unknown[]>;
  if (!Array.isArray(plan.tables) || plan.tables.length !== recordNames.length) throw new Error("Load plan must contain all 25 tables");
  const seen = new Set<RecordName>();
  for (const table of plan.tables) {
    if (!Object.hasOwn(recordSchemas, table.record) || seen.has(table.record)) throw new Error("Invalid or duplicate plan table");
    seen.add(table.record);
    const fields = Object.keys(recordColumns[table.record]);
    records[table.record] = table.rows.map((row) => Object.fromEntries(fields.flatMap((field) => {
      const column = recordColumns[table.record][field];
      if (!column) throw new Error(`Missing column ${table.record}.${field}`);
      const value = row[column];
      if (value === null) return [];
      if (value === undefined) throw new Error(`Missing plan column: ${column}`);
      return [[field, isJsonColumn(table.record, field) ? JSON.parse(String(value)) as unknown : value]];
    })));
  }
  const verified = buildLoadPlan(records, plan.target);
  if (stableJson(verified) !== stableJson(plan)) throw new Error("Load plan was modified; rebuild it from validated records");
  if (writer.target === "postgres" && verified.target === "postgres") {
    await writer.execute(verified.sql);
  } else if (writer.target === "sheets" && verified.target === "sheets") {
    for (const table of verified.tables) {
      await writer.replaceRows({ sheet: table.name, range: "A1", valueInputOption: "RAW",
        values: [table.columns, ...table.rows.map((row) => table.columns.map((column) => row[column] ?? ""))] });
    }
  } else if (writer.target === "n8n-datatables" && verified.target === "n8n-datatables") {
    for (const table of verified.tables) await writer.upsertRows({ table: table.name, columns: table.columns, matchColumn: "id", rows: table.rows });
  }
}
