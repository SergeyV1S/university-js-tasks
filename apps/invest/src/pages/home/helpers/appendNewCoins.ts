import type { Coin } from "@/shared/api/requests";

export const appendNewCoins = (current: Coin[], next: Coin[]) => {
  const coins = new Map(current.map((coin) => [coin.id, coin]));
  for (const coin of next) {
    if (!coins.has(coin.id)) coins.set(coin.id, coin);
  }
  return [...coins.values()];
};
