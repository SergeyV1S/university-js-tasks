import type { CatalogCoin } from "@/shared/api/type";
import { formatFiatAmount } from "@/shared/helpers/format";
import { percentColor } from "@/shared/helpers/percentColor";

import type { PortfolioCurrency, Valuation } from "../types";

export const usePortfolioSummary = (
  valuation: Valuation,
  currency: PortfolioCurrency,
  coins: ReadonlyMap<string, CatalogCoin>
) => {
  const missingNames =
    valuation.kind === "missing"
      ? valuation.missingIds
          .map((id) => {
            const coin = coins.get(id);
            return coin?.symbol
              ? `${coin.name} (${coin.symbol.toUpperCase()})`
              : (coin?.name ?? id);
          })
          .join(", ")
      : "";

  if (valuation.kind !== "ready") {
    return {
      missingNames,
      total: "Недоступна",
      pnl: "Недоступны",
      pnlColor: "text-invest-muted",
      costs: null
    };
  }

  const { total, pnl, costs } = valuation;
  return {
    missingNames,
    total: formatFiatAmount(total, currency),
    pnl: formatFiatAmount(pnl, currency, true),
    pnlColor: percentColor(Math.abs(pnl) < 0.005 ? 0 : pnl),
    costs: formatFiatAmount(costs, currency)
  };
};
