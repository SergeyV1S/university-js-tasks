import { Button, Icon, Input, Notice } from "@/shared/ui";

import { MarketMetrics, MarketTable, PriceFilter } from "./components";
import { useHome, useHomePage } from "./hooks";
import "./market.css";

export const HomePage = () => {
  const state = useHome();
  return state ? <HomeContent state={state} /> : <HomePending />;
};

export const HomePending = () => <HomeContent state={null} />;

const HomeContent = ({ state }: { state: ReturnType<typeof useHome> }) => {
  const { state: view, refs, functions } = useHomePage(state);

  return (
    <div className='market-page pt-4 pb-8 lg:pt-7 lg:pb-12'>
      <header className='market-intro' data-ready={state !== null} data-enter>
        <div className='market-intro-content'>
          <h1 className='text-invest-mobile-title lg:text-invest-title'>Рынок криптовалют</h1>
          <p className='mt-2 text-invest-body text-invest-muted'>Цены и капитализация в USD</p>
          <div className='mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-invest-caption text-invest-muted lg:mt-5'>
            <p className='lg:hidden' title='Источник котировок: CoinGecko Demo API'>
              Демо-данные
            </p>
            <p
              id='market-refresh-status'
              role='status'
              className={`flex items-center gap-1.5 ${view.hasError ? "text-invest-warning" : ""}`}
            >
              <Icon
                name={view.refreshIcon.name}
                className={`shrink-0 ${view.refreshIcon.className}`}
              />
              {view.statusLabel}
            </p>
          </div>
        </div>
      </header>

      {view.notice && (
        <Notice
          {...view.notice}
          className='mt-4'
          onDismiss={functions.dismissError}
          onRetry={view.retryManually ? functions.refreshQuotes : undefined}
        />
      )}

      <div className={view.notice ? "mt-6" : "mt-4 lg:mt-7"}>
        <MarketMetrics
          metrics={state?.metrics ?? null}
          loading={!state}
          unavailable={Boolean(state?.metricsError && state.metrics === null)}
          stale={view.metricsStale && !view.bothStale}
          aria-describedby={view.metricsDescriptionId}
        />
      </div>

      <section aria-labelledby='market-table-title' className='mt-7 lg:mt-9'>
        <div className='market-toolbar'>
          <div className='min-w-0'>
            <div className='flex flex-wrap items-baseline justify-between gap-x-3'>
              <h2 id='market-table-title' className='text-invest-section'>
                {view.searchingCatalog ? "Результаты поиска" : "Топ-100 криптовалют"}
              </h2>
              {view.tableStale && !view.bothStale && (
                <p id='table-stale' className='text-invest-caption text-invest-warning'>
                  Могут быть устаревшими
                </p>
              )}
            </div>
            <div className='mt-1 flex items-center justify-between gap-1 text-invest-caption text-invest-muted'>
              <p>
                {view.searchingCatalog ? (
                  view.countLabel
                ) : (
                  <>
                    <span className='lg:hidden'>По рангу рыночной капитализации</span>
                    <span className='hidden lg:inline'>100 монет по рыночной капитализации</span>
                  </>
                )}
              </p>
              <Button
                variant='ghost'
                disabled={!state}
                aria-label='Показать капитализацию'
                aria-pressed={view.showCapitalization}
                onClick={functions.toggleCapitalization}
                className='h-11 gap-1.5 text-invest-caption lg:hidden'
              >
                <span>Капитализация</span>
                <Icon
                  name={view.showCapitalization ? "down" : "chevron"}
                  className={`size-3.25 ${view.showCapitalization ? "rotate-180" : ""}`}
                />
              </Button>
            </div>
          </div>

          <div className='flex items-center gap-2.5'>
            <div className='relative min-w-0 flex-1 lg:w-62'>
              <Icon
                name='search'
                className='pointer-events-none absolute top-3.25 left-3 text-invest-muted'
              />
              <Input
                ref={refs.searchInput}
                type='search'
                name='market-search'
                autoComplete='off'
                aria-label='Поиск по названию'
                placeholder='Поиск по названию'
                disabled={!state}
                value={view.query}
                onChange={functions.handleSearchChange}
                className={`h-11 pl-9.5 [&::-webkit-search-cancel-button]:appearance-none ${view.query ? "pr-11" : ""}`}
              />
              {view.query && (
                <Button
                  variant='ghost'
                  aria-label='Очистить поиск'
                  className='absolute top-0 right-0 size-11'
                  onClick={functions.clearSearch}
                >
                  <Icon name='close' />
                </Button>
              )}
            </div>

            <Button
              ref={refs.filterButton}
              disabled={!state}
              aria-label='Диапазон цен'
              aria-expanded={view.filterOpen}
              variant={view.hasRange ? "selected" : "secondary"}
              aria-controls={state ? "market-price-filter" : undefined}
              onClick={functions.toggleFilter}
              className={`h-11 w-11 lg:justify-start lg:px-2.75 ${view.hasRange ? "lg:w-auto lg:min-w-52" : "lg:w-38.5"}`}
            >
              <Icon name='filter' className='text-invest-muted' />
              <span className='hidden lg:inline'>
                {view.hasRange ? `Цена  ${view.rangeLabel}` : "Диапазон цен"}
              </span>
            </Button>
          </div>
        </div>

        <div className='mt-3'>
          {state && (
            <div
              className='invest-disclosure market-filter'
              data-open={view.filterOpen}
              inert={!view.filterOpen}
            >
              <div className='flow-root'>
                <PriceFilter
                  key={view.filterSession}
                  range={state.range}
                  onApply={functions.applyPriceRange}
                />
              </div>
            </div>
          )}
          <p className='mb-2 hidden text-right text-invest-caption text-invest-muted lg:block'>
            {view.sortLabel}
          </p>
          <MarketTable
            rows={view.rows}
            sort={view.sort}
            sortBy={state?.sortBy}
            sortedByUser={state?.sortedByUser}
            loading={view.tableLoading}
            unavailable={view.unavailable}
            aria-describedby={view.tableDescriptionId}
            showCapitalization={view.showCapitalization}
            pagination={view.pagination}
          />
        </div>
      </section>
    </div>
  );
};
