import { diffLines, diffWordsWithSpace } from "diff";
import type { Change } from "diff";

export type DiffMode = "text" | "json" | "fields" | "code";
export type DiffView = "unified" | "split";
export type DiffDecision = "accept" | "reject";
export type DiffDecisions = Readonly<Record<string, DiffDecision>>;
export type DiffInput = string | Readonly<Record<string, unknown>>;
export interface DiffSegment { text: string; changed: boolean }
export interface DiffLine { number: number; text: string; segments: readonly DiffSegment[] }
export interface DiffLinePair { before?: DiffLine; after?: DiffLine }
export interface DiffTextGroup { id: string; kind: "unchanged" | "changed"; pairs: readonly DiffLinePair[] }
export interface DiffField { id: string; field: string; before?: unknown; after?: unknown; hasBefore: boolean; hasAfter: boolean; kind: "added" | "removed" | "changed" }
export interface DiffModel { groups: readonly DiffTextGroup[]; fields: readonly DiffField[]; additions: number; removals: number; beforeText: string; afterText: string }

export const getDiffFieldId = (field: string): string => `field:${field}`;
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
function check(signal?: AbortSignal) { if (signal?.aborted) throw new DOMException("Aborted", "AbortError"); }
function sorted(value: unknown, ancestors = new Set<object>()): unknown {
  if (!value || typeof value !== "object") return value;
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new TypeError("Values must be JSON-compatible records");
  if (ancestors.has(value)) throw new TypeError("Circular data cannot be compared");
  ancestors.add(value);
  const result = Array.isArray(value) ? value.map((entry) => sorted(entry, ancestors)) : Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted((value as Record<string, unknown>)[key], ancestors)]));
  ancestors.delete(value);
  return result;
}
export function formatDiffValue(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  return JSON.stringify(sorted(value)) ?? String(value);
}
const comparable = (value: unknown): string => {
  const encode = (entry: unknown): string => {
    if (entry === null) return "null";
    if (Array.isArray(entry)) return `array:[${entry.map(encode).join(",")}]`;
    if (typeof entry === "object") return `record:{${Object.entries(entry).map(([key, item]) => `${JSON.stringify(key)}:${encode(item)}`).join(",")}}`;
    return `${typeof entry}:${typeof entry === "number" ? String(entry) : JSON.stringify(entry)}`;
  };
  return encode(sorted(value));
};
/** Record snapshots compare by typed contents; strings retain their identity. */
export function getDiffInputKey(input: DiffInput): DiffInput {
  try { return typeof input === "string" ? input : comparable(input); }
  catch { return input; } // Invalid/cyclic records still reach the error state.
}
function textInput(input: DiffInput, mode: DiffMode) {
  if (mode === "json") return JSON.stringify(sorted(typeof input === "string" ? JSON.parse(input) : input), null, 2);
  if (typeof input !== "string") throw new TypeError("Text and code inputs must be strings");
  return input;
}
const lines = (text: string) => text === "" ? [] : text.replace(/\r\n/g, "\n").split("\n").slice(0, text.endsWith("\n") ? -1 : undefined);
function segments(before: string | undefined, after: string | undefined): [DiffSegment[], DiffSegment[]] {
  if (before === undefined) return [[], [{ text: after ?? "", changed: true }]];
  if (after === undefined) return [[{ text: before, changed: true }], []];
  // Very long or unrelated lines still receive a whole-line highlight. Bound
  // synchronous word work; line matching itself always runs asynchronously.
  const changes = before.length + after.length < 16000 ? diffWordsWithSpace(before, after, { timeout: 4, maxEditLength: 100 }) : undefined;
  if (!changes) return [[{ text: before, changed: true }], [{ text: after, changed: true }]];
  return [changes.filter((part) => !part.added).map((part) => ({ text: part.value, changed: part.removed })), changes.filter((part) => !part.removed).map((part) => ({ text: part.value, changed: part.added }))];
}

/** Async line matching and bounded, yielded word work keep large inputs usable. */
export async function buildDiffModel(before: DiffInput, after: DiffInput, options: { mode?: DiffMode; hideWhitespace?: boolean; signal?: AbortSignal } = {}): Promise<DiffModel> {
  const { mode = "text", hideWhitespace = true, signal } = options;
  await pause(); check(signal);
  if (mode === "fields") {
    const record = (value: DiffInput) => value && typeof value === "object" && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
    if (!record(before) || !record(after) || typeof before === "string" || typeof after === "string") throw new TypeError("Field inputs must be plain records");
    const fields: DiffField[] = [];
    const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
    let additions = 0; let removals = 0;
    for (let index = 0; index < keys.length; index++) {
      const field = keys[index]!; const hasBefore = Object.hasOwn(before, field); const hasAfter = Object.hasOwn(after, field);
      const beforeKey = comparable(before[field]); const afterKey = comparable(after[field]);
      if (!hasBefore || !hasAfter || beforeKey !== afterKey) {
        fields.push({ id: getDiffFieldId(field), field, before: before[field], after: after[field], hasBefore, hasAfter, kind: !hasBefore ? "added" : !hasAfter ? "removed" : "changed" });
        if (hasBefore) removals++; if (hasAfter) additions++;
      }
      if (index % 50 === 49) { await pause(); check(signal); }
    }
    return { groups: [], fields, additions, removals, beforeText: "", afterText: "" };
  }
  const beforeText = textInput(before, mode); const afterText = textInput(after, mode);
  const sourceBefore = lines(beforeText); const sourceAfter = lines(afterText);
  const changes = await new Promise<Change[] | undefined>((resolve) => {
    diffLines(beforeText, afterText, { ignoreWhitespace: hideWhitespace, maxEditLength: 256, callback: resolve });
  });
  check(signal);
  // A bounded edit-distance fallback is a valid replacement diff, rather than
  // keeping an unrelated 5,000-line document in an expensive search.
  const parts = changes ?? [{ value: beforeText, count: sourceBefore.length, removed: true, added: false }, { value: afterText, count: sourceAfter.length, removed: false, added: true }];
  const groups: DiffTextGroup[] = []; let oldIndex = 0; let newIndex = 0; let additions = 0; let removals = 0; let work = 0; let sliceStart = performance.now();
  for (let partIndex = 0; partIndex < parts.length; partIndex++) {
    const part = parts[partIndex]!;
    if (!part.added && !part.removed) {
      const count = part.count; const pairs: DiffLinePair[] = [];
      const id = `unchanged:${oldIndex + 1}:${newIndex + 1}:${count}`;
      for (let index = 0; index < count; index++) {
        const beforeLine = sourceBefore[oldIndex] ?? ""; const afterLine = sourceAfter[newIndex] ?? "";
        pairs.push({ before: { number: ++oldIndex, text: beforeLine, segments: [{ text: beforeLine, changed: false }] }, after: { number: ++newIndex, text: afterLine, segments: [{ text: afterLine, changed: false }] } });
        if (++work % 100 === 0) { await pause(); check(signal); }
      }
      groups.push({ id, kind: "unchanged", pairs });
      continue;
    }
    const removed: string[] = []; const added: string[] = [];
    while (partIndex < parts.length && (parts[partIndex]!.added || parts[partIndex]!.removed)) {
      const changed = parts[partIndex]!;
      if (changed.removed) removed.push(...sourceBefore.slice(oldIndex, oldIndex + changed.count));
      if (changed.added) added.push(...sourceAfter.slice(newIndex, newIndex + changed.count));
      if (changed.removed) oldIndex += changed.count;
      if (changed.added) newIndex += changed.count;
      partIndex++;
    }
    partIndex--;
    const pairs: DiffLinePair[] = []; const startBefore = oldIndex - removed.length + 1; const startAfter = newIndex - added.length + 1;
    for (let index = 0; index < Math.max(removed.length, added.length); index++) {
      const beforeLine = removed[index]; const afterLine = added[index]; const [beforeSegments, afterSegments] = segments(beforeLine, afterLine);
      pairs.push({ ...(beforeLine !== undefined ? { before: { number: startBefore + index, text: beforeLine, segments: beforeSegments } } : {}), ...(afterLine !== undefined ? { after: { number: startAfter + index, text: afterLine, segments: afterSegments } } : {}) });
      if (++work % 25 === 0 || performance.now() - sliceStart > 7) { await pause(); check(signal); sliceStart = performance.now(); }
    }
    removals += removed.length; additions += added.length;
    groups.push({ id: `hunk:${startBefore}:${startAfter}:${removed.length}:${added.length}`, kind: "changed", pairs });
  }
  return { groups, fields: [], additions, removals, beforeText, afterText };
}
