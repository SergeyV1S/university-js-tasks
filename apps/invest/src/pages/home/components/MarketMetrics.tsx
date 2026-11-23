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
      className='relative grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4'
    >
      {stale && (
        <p
          id='metrics-stale'
          className='col-span-full text-right text-invest-caption text-invest-warning'
        >
          Могут быть устаревшими
        </p>
      )}
      {cards.map(
        (
          {
            title,
            description,
            value,
            change,
            visible,
            explanationId,
            handlePointerLeave,
            handlePointerEnter,
            toggleExplanation
          },
          index
        ) => (
          <article
            key={title}
            ref={visible ? activeCard : undefined}
            onPointerLeave={handlePointerLeave}
            className='h-23.5 min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-2.5 pt-2.75 lg:relative lg:h-28 lg:px-4.25 lg:pt-3.5'
          >
            <div className='relative lg:static'>
              <h2 className='text-invest-note text-invest-muted lg:text-invest-label'>{title}</h2>
              <Button
                aria-label={`Подробнее: ${title}`}
                aria-expanded={visible}
                aria-controls={visible ? explanationId : undefined}
                variant='ghost'
                ref={visible ? activeHelp : undefined}
                onPointerEnter={handlePointerEnter}
                onClick={toggleExplanation}
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
                  {value}
                </p>
                {change && (
                  <p className={`mt-0.75 text-invest-caption lg:mt-1 ${change.color}`}>
                    {change.label}
                  </p>
                )}
              </>
            )}

            {visible && (
              <div
                id={explanationId}
                role='region'
                aria-label={title}
                className={`absolute inset-x-0 z-10 min-h-25.75 rounded-[10px] border border-invest-border bg-invest-raised px-3.25 pt-2.75 pb-4 shadow-lg lg:top-18 lg:-right-px lg:left-auto lg:w-68.25 ${index < 2 ? "top-19" : "top-44.5"}`}
              >
                <p className='pr-7 text-invest-label'>{title}</p>
                <Button
                  aria-label='Закрыть пояснение'
                  variant='ghost'
                  className='absolute top-0 right-0 h-11 w-10.75'
                  onClick={closeExplanation}
                >
                  <Icon name='close' />
                </Button>
                <p className='mt-2 text-invest-caption'>{description}</p>
              </div>
            )}
          </article>
        )
      )}
    </section>
  );
};
