import { useRef, useState } from "react";

import { Banner } from "../../shared/ui/Banner";
import { Button } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { Input } from "../../shared/ui/Input";
import { initialSort } from "./api";
import { MarketMetrics } from "./components/MarketMetrics";
import { MarketTable } from "./components/MarketTable";
import { PriceFilter } from "./components/PriceFilter";
import { formatTime } from "./helpers/format";
import { selectRows } from "./helpers/selectRows";
import { useHome } from "./hooks/useHome";

const coinCount = new Intl.NumberFormat("ru");
const plural = new Intl.PluralRules("ru");
const countNoun: Partial<Record<Intl.LDMLPluralRule, string>> = { one: "монета", few: "монеты", many: "монет" };

export const HomePage = () => {
  const state = useHome();
  return state ? <HomeContent state={state} /> : <HomePending />;
};

export const HomePending = () => <HomeContent state={null} />;

const HomeContent = ({ state }: { state: ReturnType<typeof useHome> }) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCapitalization, setShowCapitalization] = useState(false);
  const filterButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const { query = "", sort = initialSort } = state ?? {};
  const searchingCatalog = query.trim() !== "";
  const rows = state ? selectRows(
    state.results ?? (state.searching || !searchingCatalog ? state.top ?? [] : []),
    { ...state.range, sort, includeUnranked: searchingCatalog && !state.sortedByUser },
  ) : [];
  const hasError = state?.marketError || state?.searchError;
  const unavailable = Boolean(state && (searchingCatalog ? state.searchError : state.top === null));
  const hasRange = Boolean(state && (state.range.min !== null || state.range.max !== null));
  const min = state?.range.min;
  const max = state?.range.max;
  const rangeLabel = min != null && max != null ? `$${coinCount.format(min)}–${coinCount.format(max)}`
    : min != null ? `от $${coinCount.format(min)}`
    : max != null ? `до $${coinCount.format(max)}` : "";

  const refresh = () => {
    setDismissed(false);
    void state?.refresh();
  };

  return (
    <div className="pt-5 pb-8 lg:pt-7 lg:pb-12">
      <h1 className="text-invest-mobile-title lg:text-invest-title">Рынок криптовалют</h1>
      <div className="mt-[5px] flex flex-wrap justify-between gap-x-3 text-invest-muted lg:flex-nowrap">
        <p className="w-full text-invest-body lg:w-auto">
          <span className="lg:hidden">Цены и капитализация в USD</span>
          <span className="hidden lg:inline">Цены, изменения и капитализация криптовалют в USD</span>
        </p>
        <p className="mt-[3px] text-invest-caption lg:hidden" title="Источник котировок: CoinGecko Demo API">Демо-данные</p>
        <p role="status" className="mt-[3px] flex w-[164px] items-center gap-[5px] text-invest-caption lg:mt-0 lg:w-[234px]">
          <Icon name={hasError ? "alert" : "check"} className={`shrink-0 ${hasError ? "text-invest-warning" : "text-invest-positive"}`} />
          {state?.refreshing ? "Обновляем котировки…" : hasError ? "Обновление приостановлено"
            : state?.updatedAt ? `Обновлено в ${formatTime(state.updatedAt)}` : "Загрузка котировок…"}
        </p>
      </div>

      {hasError && !dismissed && (
        <Banner role="alert" className="relative mt-4 flex min-h-[74px] gap-2 px-3 pt-[11px] pb-2.5 pr-12">
          <Icon name="alert" className="mt-0.5 size-[18px] shrink-0" />
          <div>
            <p className="text-invest-label">{state?.searchError ? "Не удалось выполнить поиск" : "Не удалось загрузить рыночные данные"}</p>
            <button type="button" className="mt-1 cursor-pointer rounded-sm text-invest-caption text-invest-foreground underline"
              disabled={state?.refreshing} onClick={refresh}>Повторить запрос</button>
          </div>
          <Button variant="ghost" aria-label="Закрыть уведомление" className="absolute top-0 right-0 h-11 w-[43px]" onClick={() => setDismissed(true)}>
            <Icon name="close" />
          </Button>
        </Banner>
      )}

      <div className={hasError && !dismissed ? "mt-6" : "mt-4 lg:mt-7"}>
        <MarketMetrics metrics={state?.metrics ?? null} loading={!state} />
      </div>

      <section aria-labelledby="market-table-title" className="mt-[25px] lg:mt-9">
        <h2 id="market-table-title" className="text-invest-section">{searchingCatalog ? "Результаты поиска" : "Топ-100 криптовалют"}</h2>
        <div className="relative mt-px flex h-[18px] items-center justify-between text-invest-caption text-invest-muted">
          <p>
            {searchingCatalog
              ? state?.searching ? "Поиск монет…" : `${coinCount.format(rows.length)} ${countNoun[plural.select(rows.length)] ?? "монет"}`
              : <>
                <span className="lg:hidden">По рангу рыночной капитализации</span>
                <span className="hidden lg:inline">100 монет по рыночной капитализации</span>
              </>}
          </p>
          <Button variant="ghost" disabled={!state} aria-label="Показать капитализацию"
            aria-pressed={showCapitalization} onClick={() => setShowCapitalization(!showCapitalization)}
            className="h-[26px] gap-1.5 text-invest-caption lg:hidden">
            <span>Капитализация</span>
            <Icon name={showCapitalization ? "down" : "chevron"} className={`size-[13px] ${showCapitalization ? "rotate-180" : ""}`} />
          </Button>
        </div>

        <div className="mt-2 flex items-center gap-2.5 lg:mt-[7px]">
          <div className="relative min-w-0 flex-1 lg:max-w-[320px]">
            <Icon name="search" className="pointer-events-none absolute top-[13px] left-3 text-invest-muted" />
            <Input ref={searchInput} type="search" aria-label="Поиск по названию" placeholder="Поиск по названию"
              disabled={!state} value={query} onChange={(event) => {
                setDismissed(false);
                state?.setQuery(event.target.value);
              }}
              className={`h-11 pl-9.5 [&::-webkit-search-cancel-button]:appearance-none ${query ? "pr-11" : ""}`} />
            {query && (
              <Button variant="ghost" aria-label="Очистить поиск" className="absolute top-0 right-0 h-11 w-[42px]" onClick={() => {
                state?.setQuery("");
                searchInput.current?.focus();
              }}>
                <Icon name="close" />
              </Button>
            )}
          </div>

          <Button ref={filterButton} disabled={!state} aria-label="Диапазон цен" aria-expanded={filterOpen} variant={hasRange ? "selected" : "secondary"} aria-controls={filterOpen ? "market-price-filter" : undefined}
            onClick={() => setFilterOpen(!filterOpen)}
            className={`h-11 w-11 lg:justify-start lg:px-[11px] ${hasRange ? "lg:w-auto lg:min-w-[208px]" : "lg:w-[154px]"}`}>
            <Icon name="filter" className="text-invest-muted" />
            <span className="hidden lg:inline">{hasRange ? `Цена  ${rangeLabel}` : "Диапазон цен"}</span>
          </Button>

          <p className="ml-auto hidden text-invest-caption text-invest-muted lg:block">
            {{ rank: "По рангу", name: "По названию", price: "По цене", change24h: "По изменению за 24 ч", marketCap: "По капитализации" }[sort.key]}
          </p>
        </div>

        <div className="mt-3 space-y-3">
          {filterOpen && state && (
            <PriceFilter range={state.range} onApply={(min, max) => {
              state.setRange(min, max);
              setFilterOpen(false);
              filterButton.current?.focus();
            }} />
          )}
          <MarketTable rows={rows} sort={sort} sortBy={state?.sortBy} sortedByUser={state?.sortedByUser} loading={!state}
            unavailable={unavailable} showCapitalization={showCapitalization} />
        </div>
      </section>
    </div>
  );
};
