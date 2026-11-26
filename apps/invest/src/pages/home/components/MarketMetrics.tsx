import { Button, Icon, Skeleton } from "@/shared/ui";

import type { HomeInitialData } from "../actions";
import { useMarketMetrics } from "../hooks";

type MetricsProps = {
  metrics: HomeInitialData["metrics"]["data"];
  loading?: boolean;
  unavailable?: boolean;
  stale?: boolean;
  "aria-describedby"?: string;
};

export const MarketMetrics = ({
  metrics,
  loading,
  unavailable,
  stale,
  "aria-describedby": descriptionId
}: MetricsProps) => {
  const { cards, activeCard, activeHelp, closeExplanation, view } = useMarketMetrics(
    metrics,
    loading,
    unavailable
  );

  return (
    <section
      aria-label='Рыночные метрики'
      aria-describedby={descriptionId}
      className='market-metrics relative grid grid-cols-2 gap-2.5 md:grid-cols-4 lg:gap-3'
    >
      {stale && (
        <p
          id='metrics-stale'
          className='col-span-full text-right text-invest-caption text-invest-warning'
        >
          Могут быть устаревшими
        </p>
      )}
      {cards.map((card) => (
        <article
          key={card.title}
          ref={card.visible ? activeCard : undefined}
          onPointerLeave={card.handlePointerLeave}
          className='market-metric min-h-25 min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-2.75 pt-3 pb-2.5 lg:relative lg:min-h-28 lg:px-4.75 lg:pt-3.75'
        >
          <div className='relative lg:static'>
            <h2 className='min-h-8 pr-5 text-invest-caption/4 text-invest-muted lg:min-h-0 lg:pr-8 lg:text-invest-label'>
              {card.title}
            </h2>
            <Button
              aria-label={`Подробнее: ${card.title}`}
              aria-expanded={card.visible}
              aria-controls={card.explanationId}
              variant='ghost'
              ref={card.visible ? activeHelp : undefined}
              onPointerEnter={card.handlePointerEnter}
              onClick={card.toggleExplanation}
              className='absolute -top-3 -right-2.75 size-11 lg:top-0 lg:right-0'
            >
              <Icon name='help' />
            </Button>
          </div>

          {view === "loading" && (
            <Skeleton className='mt-3 h-5 w-4/5 rounded-md lg:mt-3.5 lg:h-7 lg:w-3/5' />
          )}
          {view === "unavailable" && (
            <p className='mt-3 text-invest-caption text-invest-muted lg:mt-3.75'>
              Данные временно недоступны
            </p>
          )}
          {view === "ready" && (
            <>
              <p className='market-metric-value mt-1.25 text-invest-section lg:text-invest-metric'>
                {card.value}
              </p>
              {card.change && (
                <p className={`mt-0.75 text-invest-caption lg:mt-1 ${card.change.color}`}>
                  {card.change.label}
                </p>
              )}
            </>
          )}

          <div
            id={card.explanationId}
            role='region'
            aria-label={card.title}
            data-open={card.visible}
            inert={!card.visible}
            className='market-explanation absolute inset-x-0 top-full z-10 mt-1 min-h-25.75 rounded-xl border border-invest-border bg-invest-raised px-3.25 pt-2.75 pb-4 shadow-lg lg:top-12 lg:-right-px lg:left-auto lg:mt-0 lg:w-68.25'
          >
            <p className='pr-7 text-invest-label'>{card.title}</p>
            <Button
              aria-label='Закрыть пояснение'
              variant='ghost'
              className='absolute top-0 right-0 h-11 w-10.75'
              onClick={closeExplanation}
            >
              <Icon name='close' />
            </Button>
            <p className='mt-2 text-invest-caption'>{card.description}</p>
          </div>
        </article>
      ))}
    </section>
  );
};
