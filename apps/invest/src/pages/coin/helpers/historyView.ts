import type { MarketState } from "@/shared/market";

export const getHistoryView = (history: MarketState<Array<[number, number]>> | null) => {
  if (!history || (!history.data && !history.error)) return { kind: "loading" } as const;
  if (history.data?.length) return { kind: "ready", prices: history.data } as const;
  if (history.error) return { kind: "error" } as const;
  return { kind: "empty" } as const;
};
