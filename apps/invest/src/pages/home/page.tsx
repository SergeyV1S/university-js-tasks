import { Banner } from "../../shared/ui/Banner";
import { Button } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { Input } from "../../shared/ui/Input";
import { MarketMetrics } from "./components/MarketMetrics";
import { MarketTable } from "./components/MarketTable";
import { PriceFilter } from "./components/PriceFilter";
import { useHome } from "./hooks/useHome";
import { useHomePage } from "./hooks/useHomePage";

export const HomePage = () => {
  const state = useHome();
  return state ? <HomeContent state={state} /> : <HomePending />;
};

export const HomePending = () => <HomeContent state={null} />;

const HomeContent = ({ state }: { state: ReturnType<typeof useHome> }) => {
  const { state: view, refs, functions } = useHomePage(state);

  return (
    <div className='pt-5 pb-8 lg:pt-7 lg:pb-12'>
      <h1 className='text-invest-mobile-title lg:text-invest-title'>Рынок криптовалют</h1>
      <div className='mt-1.25 flex flex-wrap justify-between gap-x-3 text-invest-muted lg:flex-nowrap'>
        <p className='w-full text-invest-body lg:w-auto'>
          <span className='lg:hidden'>Цены и капитализация в USD</span>
          <span className='hidden lg:inline'>
            Цены, изменения и капитализация криптовалют в USD
          </span>
        </p>
        <p
          className='mt-0.75 text-invest-caption lg:hidden'
          title='Источник котировок: CoinGecko Demo API'
        >
          Демо-данные
        </p>
        <p
          role='status'
          className='mt-0.75 flex items-center justify-end w-41 gap-1.25 text-invest-caption lg:mt-0 lg:w-58.5'
        >
          <Icon
            name={view.hasError ? "alert" : "check"}
            className={`shrink-0 ${view.hasError ? "text-invest-warning" : "text-invest-positive"}`}
          />
          {view.statusLabel}
        </p>
      </div>

      {view.showError && (
        <Banner
          role='alert'
          className='relative mt-4 flex min-h-18.5 gap-2 px-3 pt-2.75 pb-2.5 pr-12'
        >
          <Icon name='alert' className='mt-0.5 size-4.5 shrink-0' />
          <div>
            <p className='text-invest-label'>
              {state?.searchError
                ? "Не удалось выполнить поиск"
                : "Не удалось загрузить рыночные данные"}
            </p>
            <button
              type='button'
              className='mt-1 cursor-pointer rounded-sm text-invest-caption text-invest-foreground underline'
              disabled={state?.refreshing}
              onClick={functions.refreshQuotes}
            >
              Повторить запрос
            </button>
          </div>
          <Button
            variant='ghost'
            aria-label='Закрыть уведомление'
            className='absolute top-0 right-0 h-11 w-10.75'
            onClick={functions.dismissError}
          >
            <Icon name='close' />
          </Button>
        </Banner>
      )}

      <div className={view.showError ? "mt-6" : "mt-4 lg:mt-7"}>
        <MarketMetrics metrics={state?.metrics ?? null} loading={!state} />
      </div>

      <section aria-labelledby='market-table-title' className='mt-6.25 lg:mt-9'>
        <h2 id='market-table-title' className='text-invest-section'>
          {view.searchingCatalog ? "Результаты поиска" : "Топ-100 криптовалют"}
        </h2>
        <div className='relative mt-px flex h-4.5 items-center justify-between text-invest-caption text-invest-muted'>
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
            className='h-6.5 gap-1.5 text-invest-caption lg:hidden'
          >
            <span>Капитализация</span>
            <Icon
              name={view.showCapitalization ? "down" : "chevron"}
              className={`size-3.25 ${view.showCapitalization ? "rotate-180" : ""}`}
            />
          </Button>
        </div>

        <div className='mt-2 flex items-center gap-2.5 lg:mt-1.75'>
          <div className='relative min-w-0 flex-1 lg:max-w-xs'>
            <Icon
              name='search'
              className='pointer-events-none absolute top-3.25 left-3 text-invest-muted'
            />
            <Input
              ref={refs.searchInput}
              type='search'
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
                className='absolute top-0 right-0 h-11 w-10.5'
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
            aria-controls={view.filterOpen ? "market-price-filter" : undefined}
            onClick={functions.toggleFilter}
            className={`h-11 w-11 lg:justify-start lg:px-2.75 ${view.hasRange ? "lg:w-auto lg:min-w-52" : "lg:w-38.5"}`}
          >
            <Icon name='filter' className='text-invest-muted' />
            <span className='hidden lg:inline'>
              {view.hasRange ? `Цена  ${view.rangeLabel}` : "Диапазон цен"}
            </span>
          </Button>

          <p className='ml-auto hidden text-invest-caption text-invest-muted lg:block'>
            {view.sortLabel}
          </p>
        </div>

        <div className='mt-3 space-y-3'>
          {view.filterOpen && state && (
            <PriceFilter range={state.range} onApply={functions.applyPriceRange} />
          )}
          <MarketTable
            rows={view.rows}
            sort={view.sort}
            sortBy={state?.sortBy}
            sortedByUser={state?.sortedByUser}
            loading={!state}
            unavailable={view.unavailable}
            showCapitalization={view.showCapitalization}
            pagination={view.pagination || undefined}
          />
        </div>
      </section>
    </div>
  );
};
