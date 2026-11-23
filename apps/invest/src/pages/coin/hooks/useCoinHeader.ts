import type { Coin } from "@/shared/market/type";
import { formatMoney, formatPercent } from "@/shared/helpers/format";
import { percentColor } from "@/shared/helpers/percentColor";

export const useCoinHeader = (coin: Coin | undefined) => {
  const change24h = coin?.change24h ?? null;

  return {
    price: formatMoney(coin?.price ?? null) || "—",
    change: formatPercent(change24h, true),
    changeColor: percentColor(change24h)
  };
};
