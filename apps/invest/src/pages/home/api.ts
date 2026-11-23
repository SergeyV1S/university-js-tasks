import { apiClient } from "../../shared/api/client";
import type { Coin } from "../../shared/api/type";
import { selectRows } from "./helpers/selectRows";

export const initialSort = { key: "rank", direction: "asc" } as const;

export const loadHome = async (signal: AbortSignal, ids?: string[]) => {
  const options = { signal };
  const [top, metrics] = await Promise.allSettled([
    apiClient.getMarkets(ids, options),
    apiClient.getGlobal(options)
  ]);
  signal.throwIfAborted();

  return {
    top:
      top.status === "fulfilled"
        ? selectRows(top.value, { min: null, max: null, sort: initialSort, includeUnranked: true })
        : null,
    metrics: metrics.status === "fulfilled" ? metrics.value : null,
    updatedAt: Date.now()
  };
};

export type HomeInitialData = Awaited<ReturnType<typeof loadHome>>;
export type Catalog = Awaited<ReturnType<typeof apiClient.getCatalog>>;

export const loadMatches = async (
  catalog: Catalog,
  query: string,
  top: Coin[],
  signal: AbortSignal
) => {
  signal.throwIfAborted();
  const matches = catalog.filter(({ name }) => name.toLowerCase().includes(query));
  const quotes = new Map(top.map((coin) => [coin.id, coin]));
  const ids = matches.filter(({ id }) => !quotes.has(id)).map(({ id }) => id);

  if (ids.length > 0) {
    const markets = await apiClient.getMarkets(ids, { signal });
    for (const coin of markets) quotes.set(coin.id, coin);
  }

  return matches.map((coin) => ({
    rank: null,
    price: null,
    change24h: null,
    marketCap: null,
    ...quotes.get(coin.id),
    ...coin
  }));
};
