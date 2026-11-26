import type { MarketState } from "@/shared/market";

import type { HistorySeries } from "../actions";

export const getHistoryView = (history: MarketState<HistorySeries> | null) => {
  if (!history || (!history.data && !history.error)) return { kind: "loading" } as const;
  const { data } = history;
  const points = data?.period === 1 ? data.candles : data?.prices;
  if (data && points?.length) return { kind: "ready", series: data } as const;
  if (history.error) return { kind: "error" } as const;
  return { kind: "empty" } as const;
};
