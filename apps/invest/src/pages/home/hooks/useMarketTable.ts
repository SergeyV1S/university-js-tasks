import { generatePath } from "react-router";

import type { Coin } from "../../../shared/api/type";
import { PATHS } from "../../../shared/constants/router-paths";
import { formatCompactMoney, formatMoney, formatPercent } from "../../../shared/helpers/format";
import { percentColor } from "../../../shared/helpers/percentColor";
import type { Sort, SortKey } from "../helpers/selectRows";

const columns = [
  { key: "rank", label: "Ранг", action: "по рангу" },
  { key: "name", label: "Монета", action: "по названию" },
  { key: "price", label: "Цена", action: "по цене" },
  { key: "change24h", label: "24 ч", action: "по изменению за сутки" },
  { key: "marketCap", label: "Капитализация", action: "по капитализации" },
] as const;

export const useMarketTable = (
  rows: Coin[],
  sort: Sort,
  sortBy?: (key: SortKey) => void,
) => ({
  columns: columns.map((column) => {
    const active = sort.key === column.key;
    const sortDirection: "ascending" | "descending" = sort.direction === "asc" ? "ascending" : "descending";
    const handleSort = () => sortBy?.(column.key);

    return { ...column, active, ariaSort: active ? sortDirection : undefined, handleSort };
  }),
  rows: rows.map((coin) => ({
    coin,
    destination: generatePath(PATHS.COIN, { coinId: encodeURIComponent(coin.id) }),
    symbol: coin.symbol?.toUpperCase(),
    price: formatMoney(coin.price),
    change: formatPercent(coin.change24h, true),
    changeColor: percentColor(coin.change24h),
    marketCap: formatCompactMoney(coin.marketCap),
  })),
});
