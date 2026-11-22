import { useEffect, useRef, useState } from "react";

import { Button } from "../../../shared/ui/Button";
import { Icon } from "../../../shared/ui/Icon";
import { Skeleton } from "../../../shared/ui/Skeleton";
import type { HomeInitialData } from "../api";
import { formatCompactMoney, formatPercent, percentColor } from "../helpers/format";

const descriptions = [
  ["Капитализация рынка", "Суммарная стоимость криптовалют по рыночным ценам."],
  ["Объём торгов за 24 ч", "Суммарный объём сделок с криптовалютами за последние 24 часа."],
  ["Доля Bitcoin", "Доля Bitcoin в общей капитализации криптовалют."],
  ["Доля Ethereum", "Доля Ethereum в общей капитализации криптовалют."],
] as const;

type MetricsProps = { metrics: HomeInitialData["metrics"]; loading?: boolean };

export const MarketMetrics = ({ metrics, loading }: MetricsProps) => {
  const [open, setOpen] = useState<{ index: number; pinned: boolean } | null>(null);
  const activeCard = useRef<HTMLElement | null>(null);
  const activeHelp = useRef<HTMLButtonElement | null>(null);

  const openIndex = open?.index;
  useEffect(() => {
    if (openIndex === undefined) return;

    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !activeCard.current?.contains(event.target)) setOpen(null);
    };
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(null);
      if (activeCard.current?.contains(document.activeElement)) activeHelp.current?.focus();
    };

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [openIndex]);

  const values = [
    formatCompactMoney(metrics?.marketCap ?? null),
    formatCompactMoney(metrics?.volume24h ?? null),
    formatPercent(metrics?.bitcoinShare ?? null),
    formatPercent(metrics?.ethereumShare ?? null),
  ];
  const capChange = metrics?.marketCapChange24h ?? null;

  return (
    <section aria-label="Рыночные метрики" className="relative grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-4">
      {descriptions.map(([title, description], index) => {
        const visible = openIndex === index;
        const explanationId = `market-metric-${index}`;

        return (
          <article key={title} ref={visible ? activeCard : undefined}
            onPointerLeave={(event) => {
              if (event.pointerType === "mouse") {
                setOpen((current) => current?.index === index && !current.pinned ? null : current);
              }
            }}
            className="h-[94px] min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-2.5 pt-[11px] lg:relative lg:h-28 lg:px-[17px] lg:pt-[14px]">
            <div className="relative lg:static">
              <h2 className="text-invest-note text-invest-muted lg:text-invest-label">{title}</h2>
              <Button aria-label={`Подробнее: ${title}`} aria-expanded={visible}
                aria-controls={visible ? explanationId : undefined} variant="ghost"
                ref={visible ? activeHelp : undefined}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") {
                    setOpen((current) => current?.pinned ? current : { index, pinned: false });
                  }
                }}
                onClick={() => setOpen((current) => current?.index === index && current.pinned ? null : { index, pinned: true })}
                className="absolute -top-3 -right-[11px] h-11 w-[42px] lg:top-0 lg:right-0">
                <Icon name="help" />
              </Button>
            </div>

            {loading
              ? <Skeleton className="mt-3 h-5 w-4/5 rounded-md lg:mt-3.5 lg:h-7 lg:w-3/5" />
              : <>
                <p className="mt-[7px] truncate text-invest-section lg:mt-[5px] lg:text-invest-metric">{values[index] || "—"}</p>
                {index === 0 && capChange !== null && (
                  <p className={`mt-[3px] text-invest-caption lg:mt-1 ${percentColor(capChange)}`}>{formatPercent(capChange, true)} за 24 ч</p>
                )}
              </>
            }

            {visible && (
              <div id={explanationId} role="region" aria-label={title}
                className={`absolute inset-x-0 z-10 min-h-[103px] rounded-[10px] border border-invest-border bg-invest-raised px-[13px] pt-[11px] pb-4 shadow-lg lg:top-[72px] lg:right-[-1px] lg:left-auto lg:w-[273px] ${index < 2 ? "top-[76px]" : "top-[178px]"}`}>
                <p className="pr-7 text-invest-label">{title}</p>
                <Button aria-label="Закрыть пояснение" variant="ghost" className="absolute top-0 right-0 h-11 w-[43px]"
                  onClick={() => {
                    activeHelp.current?.focus();
                    setOpen(null);
                  }}>
                  <Icon name="close" />
                </Button>
                <p className="mt-2 text-invest-caption">{description}</p>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};
