import type { CatalogCoin } from "@/shared/market/type";
import { ApiText } from "@/shared/ui/ApiText";
import { Skeleton } from "@/shared/ui/Skeleton";

import { usePortfolioSummary } from "../hooks/usePortfolioSummary";
import type { PortfolioCurrency, Valuation } from "../types";

type PortfolioSummaryProps = {
  valuation: Valuation;
  currency: PortfolioCurrency;
  coins: ReadonlyMap<string, CatalogCoin>;
  loading: boolean;
  stale: boolean;
  unavailable: boolean;
};

export const PortfolioSummary = ({
  valuation,
  currency,
  coins,
  loading,
  stale,
  unavailable
}: PortfolioSummaryProps) => {
  const summary = usePortfolioSummary(valuation, currency, coins);
  if (valuation.kind === "empty") return null;

  return (
    <section
      aria-label='Текущая стоимость и PnL'
      aria-busy={loading}
      className='invest-cold-edge relative min-h-45.75 min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-3.25 pt-3.5 pb-3 lg:min-h-40.5 lg:px-5.25'
    >
      {loading ? (
        <>
          <p className='text-invest-label text-invest-muted'>Текущая стоимость</p>
          <Skeleton className='mt-2.75 h-8 w-43.75' />
          <Skeleton className='mt-11.25 h-5 w-32.5' />
          <p role='status' className='sr-only'>
            Расчёты загружаются
          </p>
        </>
      ) : (
        <>
          {stale && (
            <p
              role='status'
              className='mb-1 text-invest-note text-invest-warning xl:absolute xl:top-3.5 xl:right-3.5 xl:mb-0 xl:w-51.25'
            >
              Могут быть устаревшими
            </p>
          )}
          <dl className='grid lg:grid-cols-[54.2%_minmax(0,1fr)]'>
            <div className='min-w-0'>
              <dt className='text-invest-label text-invest-muted'>Текущая стоимость</dt>
              <dd className='mt-1.25 wrap-anywhere text-invest-metric lg:text-invest-total'>
                {summary.total}
              </dd>
            </div>
            <div className='mt-3.5 min-w-0 lg:mt-0.25'>
              <dt className='text-invest-label text-invest-muted'>Общая прибыль / убыток</dt>
              <dd
                className={`mt-0.75 wrap-anywhere text-invest-section lg:mt-3.25 lg:text-invest-metric ${summary.pnlColor}`}
              >
                {summary.pnl}
              </dd>
            </div>
            {summary.costs !== null && (
              <div className='col-span-full mt-3.75 hidden items-baseline gap-2.25 border-t border-invest-divider pt-3.5 lg:flex'>
                <dt className='text-invest-label text-invest-muted'>Вложено</dt>
                <dd className='font-invest-numeric wrap-anywhere text-invest-table-number'>
                  {summary.costs}
                </dd>
              </div>
            )}
          </dl>
          {unavailable && (
            <p className='mt-3 text-invest-label text-invest-warning'>Данные временно недоступны</p>
          )}
          {valuation.kind === "missing" && (
            <p className='mt-3.75 border-t border-invest-divider pt-3.5 wrap-anywhere text-invest-label text-invest-muted'>
              Нет котировок для <ApiText value={summary.missingNames} />
            </p>
          )}
        </>
      )}
    </section>
  );
};
