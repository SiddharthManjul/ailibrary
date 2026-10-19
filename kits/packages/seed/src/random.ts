export const DEFAULT_SEED = 20261020;
export const REFERENCE_DATE = "2026-10-20T12:00:00Z";
export const SOURCE = "workflow:fieldline-seed@1.0.0";
export const DAY = 86400000;
export function rng(seed: number, stream: number): (limit: number) => number {
  let state = (seed ^ stream) >>> 0;
  if (state === 0) state = 0x6d2b79f5;
  return (limit) => { state ^= state << 13; state ^= state >>> 17; state ^= state << 5; state >>>= 0; return state % limit; };
}
export function at(days: number, minutes = 0): string { return new Date(Date.parse(REFERENCE_DATE) + days * DAY + minutes * 60000).toISOString().replace(".000Z", "Z"); }
export function date(days: number): string { return at(days).slice(0, 10); }
export function id(prefix: string, index: number): string { return `${prefix}-${String(index + 1).padStart(3, "0")}`; }
export function common(prefix: string, index: number, days = -120) { return { id: id(prefix, index), createdAt: at(days), updatedAt: at(days), source: SOURCE, aiUsed: false }; }
export function pick<T>(values: readonly T[], index: number): T { const value = values[index % values.length]; if (value === undefined) throw new Error("Cannot select from an empty recipe"); return value; }
export function slug(value: string): string { return value.toLowerCase().replaceAll(" ", "-"); }
export function money(cents: number): number { return cents / 100; }
