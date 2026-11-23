import { apiClient } from "@/shared/market/client";
import { readMarket } from "@/shared/market/resource";
import type { Coin } from "@/shared/market/type";

export const missingMarketFields = { rank: null, price: null, change24h: null, marketCap: null };

export const initialSort = { key: "rank", direction: "asc" } as const;

export const loadHome = async (signal: AbortSignal) => {
  const [top, metrics] = await Promise.all([
    readMarket(signal, () => apiClient.getMarkets(undefined, { signal })),
    readMarket(signal, () => apiClient.getGlobal({ signal }))
  ]);
  return { top, metrics };
};

export type HomeInitialData = Awaited<ReturnType<typeof loadHome>>;
export type Catalog = Awaited<ReturnType<typeof apiClient.getCatalog>>;

export const loadMatches = async (
  catalog: Catalog,
  query: string,
  top: Coin[],
  signal: AbortSignal
) => {
  const matches = catalog.filter(({ name }) => name.toLowerCase().includes(query));
  const quotes = new Map(top.map((coin) => [coin.id, coin]));
  const ids = matches.filter(({ id }) => !quotes.has(id)).map(({ id }) => id);

  if (ids.length > 0) {
    const markets = await apiClient.getMarkets(ids, { signal });
    for (const coin of markets) quotes.set(coin.id, coin);
  }

  return matches.map((coin) => ({
    ...missingMarketFields,
    ...quotes.get(coin.id),
    ...coin
  }));
};
