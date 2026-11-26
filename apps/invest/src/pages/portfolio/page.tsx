import { Banner, Button, Icon, Notice, SegmentedControl, Skeleton } from "@/shared/ui";

import { PortfolioAllocation, PortfolioSummary, PurchaseForm, PurchaseList } from "./components";
import { usePortfolioPage } from "./hooks";

const grid = "grid items-start lg:grid-cols-[minmax(0,1fr)_22.25rem] lg:gap-x-5";

export const PortfolioPending = () => (
  <div role='status' aria-label='Загрузка портфеля' aria-busy='true' className='pt-4 lg:pt-7'>
    <div className='invest-feature-panel rounded-xl border border-invest-divider p-4 lg:p-7'>
      <Skeleton className='h-8 w-48 lg:h-12 lg:w-66.5' />
      <Skeleton className='mt-2 h-4.5 w-56' />
    </div>
    <div className={`mt-7 gap-y-4 ${grid}`}>
      <div className='space-y-4'>
        <Skeleton className='h-45.75 rounded-xl! lg:h-40.5' />
        <Skeleton className='h-81.5 rounded-xl! lg:h-61.25' />
      </div>
      <section className='h-89.5 space-y-4 rounded-xl border border-invest-divider bg-invest-surface p-4.25'>
        <Skeleton className='h-6.5 w-40' />
        <Skeleton className='mt-8 h-invest-input-height w-full' />
        <Skeleton className='mt-8 h-invest-input-height w-full' />
        <Skeleton className='mt-8 h-invest-input-height w-full' />
        <Skeleton className='h-11 w-full' />
      </section>
    </div>
  </div>
);

const EmptyPortfolio = () => (
  <section className='flex items-start gap-3 rounded-xl border border-invest-divider bg-invest-surface p-4 lg:min-h-88.75 lg:flex-col lg:items-center lg:justify-center lg:gap-4 lg:text-center'>
    <span className='grid size-11 shrink-0 place-items-center rounded-invest-button border border-invest-selected-border bg-invest-selected text-invest-accent lg:size-14'>
      <Icon name='wallet' className='size-5.5' />
    </span>
    <div className='min-w-0'>
      <h2 className='text-invest-block lg:text-invest-section'>Портфель пока пуст</h2>
      <p className='mt-1 max-w-80 text-invest-caption text-invest-muted lg:text-invest-body'>
        Добавьте первую покупку, чтобы увидеть стоимость и доли монет.
      </p>
    </div>
  </section>
);

export const PortfolioPage = () => {
  const p = usePortfolioPage();
  if (p.pending) return <PortfolioPending />;

  return (
    <div className='pt-4 pb-8 lg:pt-7 lg:pb-12'>
      <header
        className={`invest-feature-panel flex-wrap items-center justify-between gap-x-2 gap-y-3 rounded-xl border border-invest-divider p-4 lg:flex lg:gap-5 lg:p-7 ${p.mobileAdd ? "hidden" : "flex"}`}
      >
        <div className='min-w-0 min-[390px]:flex-1'>
          <h1 className='text-invest-mobile-title lg:text-invest-title'>Мой портфель</h1>
          <p className='mt-2 flex items-center gap-1.75 text-invest-caption text-invest-muted'>
            <Icon name='lock' className='shrink-0' />
            Покупки хранятся в этом браузере
          </p>
          <p className='mt-1.25 text-invest-caption text-invest-muted lg:hidden'>Демо-данные</p>
        </div>
        <SegmentedControl aria-label='Валюта портфеля' className='w-26.5 lg:w-36'>
          <Button
            variant='segment'
            aria-pressed={p.currency === "RUB"}
            onClick={p.chooseRub}
            disabled={p.saving}
          >
            RUB
          </Button>
          <Button
            variant='segment'
            aria-pressed={p.currency === "USD"}
            onClick={p.chooseUsd}
            disabled={p.saving}
          >
            USD
          </Button>
        </SegmentedControl>
      </header>

      {p.mobileAdd && (
        <Button
          variant='ghost'
          onClick={p.closePurchase}
          className='mb-2.25 flex h-11 justify-start lg:hidden'
        >
          <Icon name='back' />
          Мой портфель
        </Button>
      )}

      <div className={p.mobileAdd ? "lg:mt-7.25" : "mt-3.5 lg:mt-7.25"}>
        {p.saved && (
          <Banner
            variant='success'
            role='status'
            className={`purchase-saved-enter mb-3 min-h-invest-input-height items-center gap-2.25 pl-3 text-invest-label ${p.mobileAdd ? "hidden lg:flex" : "flex"}`}
          >
            <Icon name='check' className='size-4.5 shrink-0' />
            <span className='flex-1'>Покупка сохранена</span>
            <Button
              variant='ghost'
              onClick={p.dismissSuccess}
              aria-label='Закрыть уведомление'
              className='size-11'
            >
              <Icon name='close' />
            </Button>
          </Banner>
        )}
        {p.readFailed ? (
          <>
            <Banner role='alert' className='flex min-h-18.5 items-start gap-2.25 p-3'>
              <Icon name='alert' className='mt-0.5 size-4.5 shrink-0' />
              <div>
                <p className='text-invest-label'>Не удалось открыть портфель</p>
                <p className='mt-0.75 text-invest-caption text-invest-muted'>
                  Проверьте доступ к хранилищу браузера.
                </p>
              </div>
            </Banner>
            <Button onClick={p.retryRead} className='mt-3 mb-5.25 h-11 w-32.5'>
              Повторить
            </Button>
          </>
        ) : (
          !p.writable && (
            <Banner role='alert' className='mb-3 flex items-center gap-2.25 p-3 text-invest-label'>
              <Icon name='alert' className='size-4.5 shrink-0' />
              Добавление покупок недоступно. Этот браузер не поддерживает Web Locks.
            </Banner>
          )
        )}

        {p.notice && <Notice {...p.notice} className='mb-3' onDismiss={p.dismissMarketNotice} />}

        <div className={p.readFailed ? "lg:max-w-89" : grid}>
          {!p.readFailed &&
            (!p.hasPurchases ? (
              <div
                className={`mb-4 lg:col-start-1 lg:row-start-1 lg:mb-0 ${p.mobileAdd ? "hidden lg:block" : ""}`}
              >
                <EmptyPortfolio />
              </div>
            ) : (
              <div className={p.mobileAdd ? "hidden lg:contents" : "contents"}>
                <div className='lg:col-start-1 lg:row-start-1'>
                  <PortfolioSummary
                    valuation={p.valuation}
                    currency={p.currency}
                    coins={p.ownedCoins}
                    loading={p.valuationLoading}
                    stale={p.valuationStale}
                    unavailable={p.valuationUnavailable}
                  />
                </div>
                <Button
                  ref={p.mobileAddButton}
                  variant='primary'
                  onClick={p.openPurchase}
                  disabled={!p.writable}
                  className='relative mt-3 h-11 w-full lg:hidden'
                >
                  <Icon name='plus' className='absolute left-3' />
                  Добавить покупку
                </Button>
                <div className='mt-3.5 lg:col-start-1 lg:row-start-2 lg:mt-4'>
                  <PortfolioAllocation
                    valuation={p.valuation}
                    coins={p.ownedCoins}
                    loading={p.valuationLoading}
                  />
                </div>
              </div>
            ))}
          <PurchaseForm
            className={`${p.animateMobilePurchase ? "mobile-purchase-enter" : ""} ${p.purchaseFormPlacement}`}
            mobileAdd={p.mobileAdd}
            mobileHeading={p.mobileHeading}
            onSaved={p.closePurchase}
          />
          {!p.readFailed && p.hasPurchases && (
            <div
              className={`mt-4.5 min-w-0 lg:col-start-1 lg:row-start-3 lg:mt-4.75 ${p.mobileAdd ? "hidden lg:block" : ""}`}
            >
              <PurchaseList purchases={p.purchases} coins={p.ownedCoins} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
