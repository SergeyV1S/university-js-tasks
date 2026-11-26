import { getCoinsList, getCoinsMarkets, getGlobal } from "@/shared/api/requests";
import { readMarket } from "@/shared/market";
import type { Coin } from "@/shared/api/requests";

export const missingMarketFields = { rank: null, price: null, change24h: null, marketCap: null };

export const initialSort = { key: "rank", direction: "asc" } as const;

export const loadHome = async (signal: AbortSignal) => {
  const [top, metrics] = await Promise.all([
    readMarket(signal, () => getCoinsMarkets({ config: { signal } })),
    readMarket(signal, () => getGlobal({ config: { signal } }))
  ]);
  return { top, metrics };
};

export type HomeInitialData = Awaited<ReturnType<typeof loadHome>>;
export type Catalog = Awaited<ReturnType<typeof getCoinsList>>;

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
    const markets = await getCoinsMarkets({ params: { ids }, config: { signal } });
    for (const coin of markets) quotes.set(coin.id, coin);
  }

  return matches.map((coin) => ({
    ...missingMarketFields,
    ...quotes.get(coin.id),
    ...coin
  }));
};
