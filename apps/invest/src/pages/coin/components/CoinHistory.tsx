import { lazy, Suspense } from "react";

import { Button, Icon, SegmentedControl, Skeleton } from "@/shared/ui";

import { useCoinHistory } from "../hooks";

const HistoryChart = lazy(async () => ({ default: (await import("./HistoryChart")).HistoryChart }));

const HistoryPending = () => (
  <div role='status' aria-label='Загрузка истории цены' className='h-full'>
    <Skeleton className='h-full rounded-[7px]!' />
  </div>
);

export const CoinHistory = ({ pending = false }: { pending?: boolean }) => {
  const { options, period, view } = useCoinHistory(pending);

  return (
    <section
      aria-labelledby='coin-history-heading'
      className='invest-cold-edge relative min-h-74.5 min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-3.25 pt-3 pb-3.25 lg:min-h-101.75 lg:px-5.5 lg:pb-4'
    >
      <div className='flex flex-col gap-2.25 lg:flex-row lg:justify-between'>
        <h2 id='coin-history-heading' className='text-invest-block lg:mt-1.5'>
          История цены
        </h2>
        <SegmentedControl aria-label='Период графика' className='lg:w-63'>
          {options.map(({ days, label, selected, select }) => (
            <Button
              key={days}
              variant='segment'
              aria-pressed={selected}
              disabled={pending}
              onClick={select}
            >
              {label}
            </Button>
          ))}
        </SegmentedControl>
      </div>
      <p className='mt-3 text-invest-caption text-invest-muted lg:mt-1.75'>Цена в USD</p>
      <div className='mt-3 h-37.5 min-w-0 lg:mt-4 lg:h-68'>
        {view.kind === "loading" && <HistoryPending />}
        {view.kind === "ready" && (
          <Suspense fallback={<HistoryPending />}>
            <HistoryChart prices={view.prices} period={period} />
          </Suspense>
        )}
        {(view.kind === "error" || view.kind === "empty") && (
          <div role='status' className='flex flex-col items-center pt-5 text-center lg:pt-11'>
            {view.kind === "error" ? (
              <Icon name='alert' className='size-5 text-invest-warning' />
            ) : (
              <Icon name='chart' className='text-invest-muted' />
            )}
            <p className='mt-4 text-invest-block'>
              {view.kind === "error" ? "Не удалось загрузить график" : "За этот период нет данных"}
            </p>
            <p className='mt-2.5 text-invest-caption text-invest-muted'>Выберите другой период.</p>
          </div>
        )}
      </div>
    </section>
  );
};
