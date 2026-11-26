import type { Coin } from "@/shared/api/requests";
import { formatMoney, formatPercent, percentColor } from "@/shared/helpers";

export const useCoinHeader = (coin: Coin | undefined) => {
  const change24h = coin?.change24h ?? null;

  return {
    price: formatMoney(coin?.price ?? null) || "—",
    change: formatPercent(change24h, true),
    changeColor: percentColor(change24h)
  };
};
