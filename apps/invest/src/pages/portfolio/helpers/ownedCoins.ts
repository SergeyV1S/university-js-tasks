import type { CatalogCoin, Coin } from "@/shared/api/requests";

import type { Purchase } from "../types";

export const getOwnedCoins = (
  purchases: readonly Purchase[],
  coins: readonly Coin[] | null,
  catalog: ReadonlyMap<string, CatalogCoin> | null
) => {
  const coinsById = new Map(coins?.map((coin) => [coin.id, coin]));
  const owned = new Map<string, CatalogCoin & { image?: string }>();
  for (const { coinId } of purchases) {
    const coin = coinsById.get(coinId) ?? catalog?.get(coinId);
    if (coin) owned.set(coinId, coin);
  }
  return owned;
};
