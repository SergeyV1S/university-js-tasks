import { apiClient } from "@/shared/market/client";
import { readMarket } from "@/shared/market/resource";
import type { Coin } from "@/shared/market/type";

import { readPortfolio } from "./storage";
import type { PortfolioCurrency, PortfolioSnapshot } from "./types";

export const loadPortfolioCoins = async (signal: AbortSignal) => {
  const pages = await Promise.allSettled(
    [1, 2, 3, 4, 5].map((page) => apiClient.getMarkets(undefined, { page, signal }))
  );
  const coins = pages.flatMap((page) => {
    if (page.status === "rejected") throw page.reason;
    return page.value.filter(({ rank }) => rank === null || rank <= 100);
  });
  return [...new Map(coins.map((coin) => [coin.id, coin])).values()];
};

export const portfolioCoinIds = (snapshot: PortfolioSnapshot | null) => [
  ...new Set(snapshot?.purchases.map(({ coinId }) => coinId))
];

export const needsCatalog = (ids: string[], coins: Coin[] | null) => {
  const topIds = new Set(coins?.map(({ id }) => id));
  return ids.some((id) => !topIds.has(id));
};

export const loadPortfolioCatalog = async (signal: AbortSignal) => {
  const catalog = await apiClient.getCatalog({ signal });
  return new Map(catalog.map((coin) => [coin.id, coin]));
};

export const loadPortfolioPrices = async (
  ids: string[],
  currency: PortfolioCurrency,
  signal: AbortSignal
): Promise<Record<string, number>> => {
  if (ids.length === 0) return {};
  const quotes = await apiClient.getPrices(ids, [currency], { signal });
  return Object.fromEntries(
    Object.entries(quotes).flatMap(([id, currencies]) => {
      const price = currencies[currency];
      return price === undefined ? [] : [[id, price]];
    })
  );
};

export const loadPortfolio = async (signal: AbortSignal, currency: PortfolioCurrency) => {
  let snapshot: PortfolioSnapshot | null = null;
  try {
    snapshot = readPortfolio();
  } catch {
    // Keep the coin picker independent of the state of localStorage.
  }
  const ids = portfolioCoinIds(snapshot);
  const loadCoinsAndCatalog = async () => {
    const coins = await readMarket(signal, () => loadPortfolioCoins(signal));
    const catalog = needsCatalog(ids, coins.data)
      ? await readMarket(signal, () => loadPortfolioCatalog(signal))
      : undefined;
    return { coins, catalog };
  };

  const [{ coins, catalog }, prices] = await Promise.all([
    loadCoinsAndCatalog(),
    readMarket(signal, () => loadPortfolioPrices(ids, currency, signal))
  ]);
  return { snapshot, coins, catalog, currency, prices };
};

export type PortfolioInitialData = Awaited<ReturnType<typeof loadPortfolio>>;
