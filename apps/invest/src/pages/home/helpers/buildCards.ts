import type { GlobalMetrics } from "../../../shared/api/type";
import { formatCompactMoney, formatPercent } from "../../../shared/helpers/format";

export const buildCards = (metrics: GlobalMetrics | null) => [
  {
    title: "Капитализация рынка",
    description: "Суммарная стоимость криптовалют по рыночным ценам.",
    value: formatCompactMoney(metrics?.marketCap ?? null),
    change: metrics?.marketCapChange24h
  },
  {
    title: "Объём торгов за 24 ч",
    description: "Суммарный объём сделок с криптовалютами за последние 24 часа.",
    value: formatCompactMoney(metrics?.volume24h ?? null)
  },
  {
    title: "Доля Bitcoin",
    description: "Доля Bitcoin в общей капитализации криптовалют.",
    value: formatPercent(metrics?.bitcoinShare ?? null)
  },
  {
    title: "Доля Ethereum",
    description: "Доля Ethereum в общей капитализации криптовалют.",
    value: formatPercent(metrics?.ethereumShare ?? null)
  }
];
