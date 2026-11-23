import { apiClient } from "../../shared/api/client";
import { readPortfolio } from "./storage";
import type { PortfolioInitialData } from "./types";

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

export const loadPortfolio = async (signal: AbortSignal): Promise<PortfolioInitialData> => {
  const coins = await loadPortfolioCoins(signal).catch(() => null);
  try {
    return { coins, snapshot: readPortfolio() };
  } catch {
    return { coins, snapshot: null };
  }
};
