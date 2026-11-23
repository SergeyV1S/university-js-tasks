import type { CatalogCoin } from "@/shared/api/type";
import { ApiText } from "@/shared/ui/ApiText";
import { Skeleton } from "@/shared/ui/Skeleton";

import { usePortfolioAllocation } from "../hooks/usePortfolioAllocation";
import type { Valuation } from "../types";

type PortfolioAllocationProps = {
  valuation: Valuation;
  coins: ReadonlyMap<string, CatalogCoin>;
  loading: boolean;
};

export const PortfolioAllocation = ({ valuation, coins, loading }: PortfolioAllocationProps) => {
  const { canvas, rows, count, countLabel } = usePortfolioAllocation(
    coins,
    valuation.kind === "ready" ? valuation.allocations : undefined
  );
  if (valuation.kind === "empty") return null;

  return (
    <section
      aria-labelledby='portfolio-allocation'
      aria-busy={loading}
      className='min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-3.25 pt-3 pb-4.75 lg:min-h-61.25 lg:px-5.25'
    >
      <h2 id='portfolio-allocation' className='text-invest-block'>
        Структура портфеля
      </h2>
      {loading ? (
        <Skeleton className='mx-auto mt-4.25 mb-1.5 h-35.5 w-42.5 lg:mx-0 lg:mt-6.5' />
      ) : valuation.kind === "missing" ? (
        <p className='mt-6.75 text-invest-body text-invest-muted'>
          Структура недоступна до получения всех котировок.
        </p>
      ) : count === 0 ? (
        <p className='mt-6.75 text-invest-body text-invest-muted'>
          Доли недоступны при нулевой стоимости портфеля
        </p>
      ) : (
        <div className='mt-4.25 grid justify-items-center lg:mt-3.25 lg:grid-cols-[10.5rem_minmax(0,1fr)] lg:items-start lg:justify-items-stretch lg:gap-9.75 lg:pl-0.75'>
          <div className='relative size-36 lg:size-42'>
            <canvas ref={canvas} role='img' aria-label='Доли монет' />
            <div
              className='pointer-events-none absolute inset-0 grid content-center justify-items-center'
              aria-hidden='true'
            >
              <span className='text-invest-metric'>{count}</span>
              <span className='-mt-1.25 text-invest-caption text-invest-muted'>{countLabel}</span>
            </div>
          </div>
          <ul role='list' className='mt-2.5 w-full min-w-0 divide-y divide-invest-divider lg:mt-2'>
            {rows.map(({ coinId, name, symbol, percentLabel, marker }) => (
              <li
                key={coinId}
                className='grid min-h-8 grid-cols-[0.5625rem_4.5625rem_minmax(0,1fr)_auto] items-start gap-2.5 pt-0.75 lg:min-h-11.75 lg:grid-cols-[0.5625rem_6rem_minmax(0,1fr)_auto] lg:pt-1.5'
              >
                <span
                  aria-hidden='true'
                  className='mt-1.75 size-2.25 rounded-full'
                  style={{ backgroundColor: marker }}
                />
                <span className='wrap-anywhere text-invest-label'>
                  <ApiText value={name} />
                </span>
                <span className='font-invest-numeric wrap-anywhere text-invest-compact-number text-invest-muted uppercase'>
                  {symbol && <ApiText value={symbol} />}
                </span>
                <span className='pr-0.5 text-right font-invest-numeric text-invest-table-number'>
                  {percentLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
