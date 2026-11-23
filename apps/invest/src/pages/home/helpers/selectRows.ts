import type { Coin } from "@/shared/market/type";

export type SortKey = "rank" | "name" | "price" | "change24h" | "marketCap";
export type Sort = { key: SortKey; direction: "asc" | "desc" };
export type PriceRange = { min: number | null; max: number | null };

const byName = new Intl.Collator("ru", { sensitivity: "base" });

export const selectRows = (
  rows: Coin[],
  {
    min,
    max,
    sort,
    includeUnranked = false
  }: PriceRange & { sort: Sort; includeUnranked?: boolean }
): Coin[] => {
  const lower = Math.min(min ?? -Infinity, max ?? Infinity);
  const upper = Math.max(min ?? -Infinity, max ?? Infinity);
  const hasPriceFilter = min !== null || max !== null;
  const direction = sort.direction === "asc" ? 1 : -1;

  return rows
    .filter((row) => {
      if (hasPriceFilter && (row.price === null || row.price < lower || row.price > upper))
        return false;
      return row[sort.key] !== null || (includeUnranked && sort.key === "rank");
    })
    .sort((first, second) => {
      if (sort.key === "name") return direction * byName.compare(first.name, second.name);

      const a = first[sort.key];
      const b = second[sort.key];
      if (a === null) return b === null ? 0 : 1;
      if (b === null) return -1;
      return direction * (a - b);
    });
};

export const parsePrice = (value: string) => {
  const input = value.trim();
  if (input === "") return null;
  if (!/^(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(input)) return NaN;

  const price = Number(input.replace(",", "."));
  return Number.isFinite(price) ? price : NaN;
};
