import { Link } from "react-router";

import { ApiText, Button, CoinAvatar, Icon, Skeleton } from "@/shared/ui";

import { useMarketTable } from "../hooks";
import type { MarketTableOptions } from "../hooks";

type MarketTableProps = MarketTableOptions & {
  sortedByUser?: boolean;
  loading?: boolean;
  unavailable?: boolean;
  "aria-describedby"?: string;
};

const cellStyles = {
  rank: "pl-2.25 text-left max-[375px]:pl-1.5 lg:pl-4.75",
  name: "pl-1 text-left",
  price: "pr-1 text-right lg:pr-5",
  change24h: "pr-3 text-right lg:pr-5",
  marketCap: "pr-3 text-right lg:pr-3.5"
};

export const MarketTable = ({
  rows,
  sort,
  sortBy,
  sortedByUser,
  loading,
  unavailable,
  showCapitalization,
  pagination,
  "aria-describedby": descriptionId
}: MarketTableProps) => {
  const {
    columns,
    rows: tableRows,
    loadMoreRef,
    visibility
  } = useMarketTable({
    rows,
    sort,
    sortBy,
    showCapitalization,
    pagination
  });

  return (
    <div className='@container overflow-clip rounded-xl border border-invest-divider bg-invest-surface'>
      {loading && (
        <span role='status' aria-label='Загрузка котировок' className='sr-only'>
          Загрузка котировок
        </span>
      )}
      <table
        className='w-full table-fixed border-collapse'
        aria-label='Котировки монет'
        aria-describedby={descriptionId}
        aria-busy={loading || pagination?.loading}
      >
        <colgroup>
          <col className='w-9.5 max-[375px]:w-6.75 lg:w-22.5' />
          <col />
          <col className='w-22.25 max-[375px]:w-21.25 lg:w-[18cqw]' />
          <col
            className={`w-22.25 max-[375px]:w-17.5 lg:w-[calc(18.125cqw-24.6px)] ${showCapitalization ? "hidden lg:table-column" : ""}`}
          />
          <col
            className={`w-22.25 max-[375px]:w-17.5 lg:w-[calc(31.25cqw-114px)] ${showCapitalization ? "" : "hidden lg:table-column"}`}
          />
          <col className='hidden w-12.5 lg:table-column' />
        </colgroup>
        <thead className='border-b border-invest-divider bg-invest-table-header'>
          <tr>
            {columns.map(({ key, label, action, active, ariaSort, handleSort }) => (
              <th
                key={key}
                scope='col'
                className={`relative p-0 ${cellStyles[key]} ${visibility[key]}`}
                aria-sort={ariaSort}
              >
                <button
                  type='button'
                  aria-label={`Сортировать ${action}`}
                  disabled={!sortBy}
                  onClick={handleSort}
                  className={`inline-flex h-invest-input-height max-w-full items-center gap-0.5 rounded-sm text-invest-caption focus-visible:-outline-offset-2 enabled:cursor-pointer enabled:hover:text-invest-foreground max-lg:after:absolute max-lg:after:inset-0 lg:h-12 lg:text-invest-label ${active ? "text-invest-accent" : "text-invest-muted"} ${key === "rank" || key === "name" ? "" : "lg:translate-x-5"}`}
                >
                  {key === "rank" && <span className='lg:hidden'>#</span>}
                  {key === "marketCap" && <span className='lg:hidden'>Капит.</span>}
                  <span className={key === "rank" || key === "marketCap" ? "hidden lg:inline" : ""}>
                    {label}
                  </span>
                  <Icon
                    name={active ? "down" : "sort"}
                    className={`hidden shrink-0 lg:block ${active && sortedByUser && sort.direction === "asc" ? "rotate-180" : ""}`}
                  />
                </button>
              </th>
            ))}
            <th scope='col' aria-label='Детали' className='hidden lg:table-cell' />
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 10 }, (_, index) => (
                <tr
                  key={index}
                  className='h-15.5 border-b border-invest-divider last:border-b-0 lg:h-13.5'
                >
                  {columns.map(({ key }) => (
                    <td key={key} className={`${cellStyles[key]} ${visibility[key]}`}>
                      <Skeleton
                        className={`inline-block h-3 max-w-full align-middle ${key === "rank" ? "w-5" : "w-21.25"}`}
                      />
                    </td>
                  ))}
                  <td className='hidden lg:table-cell' />
                </tr>
              ))
            : tableRows.map(
                ({ coin, destination, symbol, price, change, changeColor, marketCap }) => (
                  <tr
                    key={coin.id}
                    className='market-quote relative h-15.5 border-b border-invest-divider last:border-b-0 focus-within:bg-invest-raised hover:bg-invest-raised lg:h-14'
                  >
                    <td
                      className={`font-invest-numeric text-invest-table-number text-invest-muted ${cellStyles.rank}`}
                    >
                      {coin.rank}
                    </td>
                    <td className={cellStyles.name}>
                      <div className='flex min-w-0 items-center gap-2 lg:gap-3'>
                        <CoinAvatar coin={coin} />
                        <div className='min-w-0'>
                          <Link
                            to={destination}
                            className='block truncate rounded-sm text-invest-label after:absolute after:inset-0 hover:text-invest-accent lg:text-invest-body'
                          >
                            <ApiText value={coin.name} />
                          </Link>
                          {symbol && (
                            <p className='truncate text-invest-note text-invest-muted'>
                              <ApiText value={symbol} />
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td
                      className={`font-invest-numeric text-invest-compact-number lg:text-invest-table-number ${cellStyles.price}`}
                    >
                      {price}
                    </td>
                    <td
                      className={`font-invest-numeric text-invest-compact-number lg:text-invest-table-number ${cellStyles.change24h} ${visibility.change24h} ${changeColor}`}
                    >
                      {change}
                    </td>
                    <td
                      className={`font-invest-numeric text-invest-note lg:text-invest-table-number ${cellStyles.marketCap} ${visibility.marketCap}`}
                    >
                      {marketCap}
                    </td>
                    <td className='hidden pr-2.5 text-right text-invest-muted lg:table-cell'>
                      <Icon name='next' className='market-quote-arrow ml-auto' />
                    </td>
                  </tr>
                )
              )}
        </tbody>
      </table>
      {!loading && rows.length === 0 && (
        <div role='status' className='flex h-37.5 flex-col items-center px-3 pt-4 text-center'>
          <Icon
            name={unavailable ? "alert" : "search"}
            className={`size-5.5 ${unavailable ? "text-invest-warning" : "text-invest-muted"}`}
          />
          <p className='mt-2 text-invest-block'>
            {unavailable ? "Данные временно недоступны" : "Монеты не найдены"}
          </p>
          <p className='mt-2 text-invest-caption text-invest-muted'>
            {unavailable
              ? "Котировки появятся после успешного обновления."
              : "Проверьте название или измените диапазон цен."}
          </p>
        </div>
      )}
      {pagination?.loading && (
        <p role='status' className='px-3 py-3 text-center text-invest-caption text-invest-muted'>
          Загружаем ещё монеты…
        </p>
      )}
      {pagination?.failed && (
        <div className='flex flex-wrap items-center justify-center gap-2 px-3 py-3'>
          <p role='alert' className='text-invest-caption'>
            Не удалось загрузить следующую страницу.
          </p>
          <Button
            variant='ghost'
            disabled={pagination.paused}
            onClick={pagination.loadNext}
            className='min-h-11 px-2 underline'
          >
            Повторить загрузку
          </Button>
        </div>
      )}
      {pagination && (
        <div key={pagination.page} ref={loadMoreRef} aria-hidden='true' className='h-px' />
      )}
    </div>
  );
};
