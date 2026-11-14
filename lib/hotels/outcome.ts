/** Settled fetch state for list/detail views */
export type FetchStatus = "loading" | "ready" | "error" | "blocked";

export function hasItems<T>(items: readonly T[] | undefined | null): items is T[] {
  return Boolean(items?.length);
}

export function isInventoryEmpty<T>(items: readonly T[]): boolean {
  return items.length === 0;
}

export function isFilteredEmpty<T>(all: readonly T[], visible: readonly T[]): boolean {
  return all.length > 0 && visible.length === 0;
}