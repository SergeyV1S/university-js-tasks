import type { PortfolioCurrency, Purchase, Valuation } from "../types";

export const calculateValuation = (
  purchases: Purchase[],
  prices: Record<string, number>,
  currency: PortfolioCurrency
): Valuation => {
  if (purchases.length === 0) return { kind: "empty" };

  const quantities = new Map<string, number>();

  let costs = 0;
  for (const { coinId, quantity, unitPrice, currency: purchaseCurrency, rubPerUsd } of purchases) {
    quantities.set(coinId, (quantities.get(coinId) ?? 0) + quantity);

    const cost = quantity * unitPrice;
    if (purchaseCurrency === currency) costs += cost;
    else costs += currency === "RUB" ? cost * rubPerUsd : cost / rubPerUsd;
  }

  const missingIds: string[] = [];
  const positions: { coinId: string; value: number }[] = [];
  let total = 0;
  for (const [coinId, quantity] of quantities) {
    const price = prices[coinId];
    if (!Object.hasOwn(prices, coinId) || !Number.isFinite(price) || price < 0) {
      missingIds.push(coinId);
      continue;
    }

    const value = quantity * price;
    total += value;
    positions.push({ coinId, value });
  }

  if (missingIds.length > 0) return { kind: "missing", missingIds };

  const allocations =
    total === 0
      ? []
      : positions.map(({ coinId, value }) => ({ coinId, percent: (value / total) * 100 }));
  return { kind: "ready", total, costs, pnl: total - costs, allocations };
};
