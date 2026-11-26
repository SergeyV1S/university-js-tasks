import { generatePath } from "react-router";

import type { Coin } from "@/shared/api/requests";
import { PATHS } from "@/shared/constants";
import { formatCompactMoney, formatMoney, formatPercent, percentColor } from "@/shared/helpers";
import { useInfinityScroll } from "@/shared/hooks";

import type { Sort, SortKey } from "../helpers";

const columns = [
  { key: "rank", label: "Ранг", action: "по рангу" },
  { key: "name", label: "Монета", action: "по названию" },
  { key: "price", label: "Цена", action: "по цене" },
  { key: "change24h", label: "24 ч", action: "по изменению за сутки" },
  { key: "marketCap", label: "Капитализация", action: "по капитализации" }
] as const;
const ariaSortDirections = { asc: "ascending", desc: "descending" } as const;

type MarketPagination = {
  page: number;
  loading: boolean;
  failed: boolean;
  paused: boolean;
  loadNext: () => void;
};

export type MarketTableOptions = {
  rows: Coin[];
  sort: Sort;
  sortBy?: (key: SortKey) => void;
  showCapitalization: boolean;
  pagination?: MarketPagination;
};

export const useMarketTable = ({
  rows,
  sort,
  sortBy,
  showCapitalization,
  pagination
}: MarketTableOptions) => {
  const loadMoreRef = useInfinityScroll({
    enabled: Boolean(pagination && !pagination.loading && !pagination.failed && !pagination.paused),
    onLoadMore: pagination?.loadNext
  });
  const visibility = {
    rank: "",
    name: "",
    price: "",
    change24h: showCapitalization ? "hidden lg:table-cell" : "",
    marketCap: showCapitalization ? "" : "hidden lg:table-cell"
  };
  const sortDirection = ariaSortDirections[sort.direction];

  return {
    loadMoreRef,
    visibility,
    columns: columns.map((column) => {
      const active = sort.key === column.key;
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
      marketCap: formatCompactMoney(coin.marketCap)
    }))
  };
};
