import { recordSchemas } from "./index.js";
import type { RecordName } from "./index.js";

/** Nested objects and lists are stored in a single JSON cell/JSONB column. */
export function toSnakeCase(field: string): string {
  return field.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function columnsFor(name: RecordName): Record<string, string> {
  return Object.fromEntries(Object.keys(recordSchemas[name].shape).map((field) => [field, toSnakeCase(field)]));
}

/** Top-level mappings, derived from the schemas to prevent field drift. */
export const columns = Object.fromEntries(
  (Object.keys(recordSchemas) as RecordName[]).map((name) => [name, columnsFor(name)]),
) as Record<RecordName, Record<string, string>>;

export const recordColumns = columns;
