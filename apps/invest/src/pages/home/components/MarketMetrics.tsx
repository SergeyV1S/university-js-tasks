import { Button } from "@/shared/ui/Button";
import { Icon } from "@/shared/ui/Icon";
import { Skeleton } from "@/shared/ui/Skeleton";

import type { HomeInitialData } from "../api";
import { useMarketMetrics } from "../hooks/useMarketMetrics";

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
  const { cards, activeCard, activeHelp, closeExplanation } = useMarketMetrics(metrics);

  return (
    <section
      aria-label='Рыночные метрики'
      aria-describedby={descriptionId}
      className='market-metrics relative grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4'
    >
      {stale && (
        <p
          id='metrics-stale'
          className='col-span-full text-right text-invest-caption text-invest-warning'
        >
          Могут быть устаревшими
        </p>
      )}
      {cards.map((card, index) => (
        <article
          key={card.title}
          ref={card.visible ? activeCard : undefined}
          onPointerLeave={card.handlePointerLeave}
          className={`market-metric h-23.5 min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-2.5 pt-2.75 lg:relative lg:h-28 lg:px-4.25 lg:pt-3.5 ${index === 0 ? "invest-cold-edge" : ""}`}
        >
          <div className='relative lg:static'>
            <h2 className='truncate pr-4.5 text-invest-caption/4 text-invest-muted max-[375px]:tracking-[-0.04em] lg:pr-8 lg:text-invest-label'>
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
              className='absolute -top-3 -right-2.75 h-11 w-10.5 lg:top-0 lg:right-0'
            >
              <Icon name='help' />
            </Button>
          </div>

          {loading ? (
            <Skeleton className='mt-3 h-5 w-4/5 rounded-md lg:mt-3.5 lg:h-7 lg:w-3/5' />
          ) : unavailable ? (
            <p className='mt-3 text-invest-caption text-invest-muted lg:mt-3.75'>
              Данные временно недоступны
            </p>
          ) : (
            <>
              <p className='mt-1.75 truncate text-invest-section lg:mt-1.25 lg:text-invest-metric'>
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
