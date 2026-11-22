import { generatePath, Link } from "react-router";

import type { Coin } from "../../../shared/api/client";
import { PATHS } from "../../../shared/constants/router-paths";
import { ApiText } from "../../../shared/ui/ApiText";
import { Icon } from "../../../shared/ui/Icon";
import { Skeleton } from "../../../shared/ui/Skeleton";
import { formatCompactMoney, formatMoney, formatPercent, percentColor } from "../helpers/format";
import type { Sort, SortKey } from "../helpers/selectRows";
import { CoinAvatar } from "./CoinAvatar";

const columns = [
  { key: "rank", label: "Ранг", action: "по рангу" },
  { key: "name", label: "Монета", action: "по названию" },
  { key: "price", label: "Цена", action: "по цене" },
  { key: "change24h", label: "24 ч", action: "по изменению за сутки" },
  { key: "marketCap", label: "Капитализация", action: "по капитализации" },
] as const;

type MarketTableProps = {
  rows: Coin[];
  sort: Sort;
  sortBy?: (key: SortKey) => void;
  sortedByUser?: boolean;
  loading?: boolean;
  unavailable?: boolean;
  showCapitalization: boolean;
};

const cellStyles = {
  rank: "pl-[9px] text-left lg:pl-[19px]",
  name: "pl-1 text-left",
  price: "pr-1 text-right lg:pr-5",
  change24h: "pr-3 text-right lg:pr-5",
  marketCap: "pr-3 text-right lg:pr-[14px]",
};

export const MarketTable = ({ rows, sort, sortBy, sortedByUser, loading, unavailable, showCapitalization }: MarketTableProps) => {
  const changeCell = showCapitalization ? "hidden lg:table-cell" : "";
  const capCell = showCapitalization ? "" : "hidden lg:table-cell";
  const visibility = { rank: "", name: "", price: "", change24h: changeCell, marketCap: capCell };

  return (
    <div className="@container rounded-xl border border-invest-divider bg-invest-surface">
      {loading && <span role="status" aria-label="Загрузка котировок" className="sr-only">Загрузка котировок</span>}
      <table className="w-full table-fixed border-collapse" aria-label="Котировки монет" aria-busy={loading || undefined}>
        <colgroup>
          <col className="w-[38px] lg:w-[90px]" />
          <col />
          <col className="w-[89px] lg:w-[18cqw]" />
          <col className={`w-[89px] lg:w-[calc(18.125cqw_-_24.6px)] ${showCapitalization ? "hidden lg:table-column" : ""}`} />
          <col className={`w-[89px] lg:w-[calc(31.25cqw_-_114px)] ${showCapitalization ? "" : "hidden lg:table-column"}`} />
          <col className="hidden w-[50px] lg:table-column" />
        </colgroup>
        <thead className="border-b border-invest-divider">
          <tr>
            {columns.map(({ key, label, action }) => {
              const active = sort.key === key;
              return (
                <th key={key} scope="col" className={`p-0 ${cellStyles[key]} ${visibility[key]}`}
                  aria-sort={active ? (sort.direction === "asc" ? "ascending" : "descending") : undefined}>
                  <button type="button" aria-label={`Сортировать ${action}`} disabled={!sortBy}
                    onClick={() => sortBy?.(key)}
                    className={`inline-flex h-[46px] max-w-full items-center gap-0.5 rounded-sm text-invest-caption enabled:cursor-pointer enabled:hover:text-invest-accent lg:h-12 lg:text-invest-label ${active ? "lg:text-invest-accent" : ""} ${key === "rank" || key === "name" ? "" : "lg:translate-x-5"} text-invest-muted`}>
                    {key === "rank" && <span className="lg:hidden">#</span>}
                    {key === "marketCap" && <span className="lg:hidden">Капит.</span>}
                    <span className={key === "rank" || key === "marketCap" ? "hidden lg:inline" : ""}>{label}</span>
                    <Icon name={active ? "down" : "sort"}
                      className={`hidden shrink-0 lg:block ${active && sortedByUser && sort.direction === "asc" ? "rotate-180" : ""}`} />
                  </button>
                </th>
              );
            })}
            <th scope="col" aria-label="Детали" className="hidden lg:table-cell" />
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 10 }, (_, index) => (
              <tr key={index} aria-hidden="true" className="h-[62px] border-b border-invest-divider last:border-b-0 lg:h-[54px]">
                {columns.map(({ key }) => (
                  <td key={key} className={`${cellStyles[key]} ${visibility[key]}`}>
                    <Skeleton className={`inline-block h-3 max-w-full align-middle ${key === "rank" ? "w-5" : "w-[85px]"}`} />
                  </td>
                ))}
                <td className="hidden lg:table-cell" />
              </tr>
            ))
            : rows.map((coin) => {
              const destination = generatePath(PATHS.COIN, { coinId: encodeURIComponent(coin.id) });
              return (
                <tr key={coin.id} className="relative h-[62px] bg-[linear-gradient(var(--color-invest-divider),var(--color-invest-divider))] bg-[length:calc(100%_-_18px)_1px] bg-top bg-no-repeat first:bg-none hover:bg-invest-raised/50 lg:h-[54px] lg:bg-[length:calc(100%_-_38px)_1px]">
                  <td className={`font-invest-numeric text-invest-table-number text-invest-muted ${cellStyles.rank}`}>{coin.rank}</td>
                  <td className={cellStyles.name}>
                    <div className="flex min-w-0 items-center gap-2 lg:gap-3">
                      <CoinAvatar coin={coin} />
                      <div className="min-w-0">
                        <Link to={destination} className="block truncate rounded-sm text-invest-label after:absolute after:inset-0 hover:text-invest-accent lg:text-invest-body">
                          <ApiText value={coin.name} />
                        </Link>
                        {coin.symbol && <p className="truncate text-invest-note text-invest-muted"><ApiText value={coin.symbol.toUpperCase()} /></p>}
                      </div>
                    </div>
                  </td>
                  <td className={`font-invest-numeric text-invest-compact-number lg:text-invest-table-number ${cellStyles.price}`}>{formatMoney(coin.price)}</td>
                  <td className={`font-invest-numeric text-invest-compact-number lg:text-invest-table-number ${cellStyles.change24h} ${changeCell} ${percentColor(coin.change24h)}`}>{formatPercent(coin.change24h, true)}</td>
                  <td className={`font-invest-numeric text-invest-note lg:text-invest-table-number ${cellStyles.marketCap} ${capCell}`}>{formatCompactMoney(coin.marketCap)}</td>
                  <td className="hidden pr-[10px] text-right text-invest-muted lg:table-cell">
                    <Icon name="next" className="ml-auto" />
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (
        <div role="status" className="flex h-[150px] flex-col items-center px-3 pt-4 text-center">
          <Icon name={unavailable ? "alert" : "search"} className="size-[22px] text-invest-muted" />
          <p className="mt-2 text-invest-block">{unavailable ? "Данные временно недоступны" : "Монеты не найдены"}</p>
          <p className="mt-2 text-invest-caption text-invest-muted">
            {unavailable ? "Котировки появятся после успешного обновления." : "Проверьте название или измените диапазон цен."}
          </p>
        </div>
      )}
    </div>
  );
};
