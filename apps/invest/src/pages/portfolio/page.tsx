import { Banner } from "../../shared/ui/Banner";
import { Button } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { SegmentedControl } from "../../shared/ui/SegmentedControl";
import { Skeleton } from "../../shared/ui/Skeleton";
import { PurchaseForm } from "./components/PurchaseForm";
import { PurchaseList } from "./components/PurchaseList";
import { usePortfolioPage } from "./hooks/usePortfolioPage";

const grid = "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22.25rem] lg:gap-5";

export const PortfolioPending = () => (
  <div role='status' aria-label='Загрузка портфеля' aria-busy='true' className='pt-5.5 lg:pt-7.25'>
    <Skeleton className='h-10 w-53 lg:h-12 lg:w-66.5' />
    <Skeleton className='mt-2 h-4.5 w-56' />
    <div className={`mt-7 ${grid}`}>
      <Skeleton className='h-25 rounded-xl! lg:h-88.75' />
      <section className='h-89.5 space-y-4 rounded-xl border border-invest-divider bg-invest-surface p-4.25'>
        <Skeleton className='h-6.5 w-40' />
        <Skeleton className='mt-8 h-11.5 w-full' />
        <Skeleton className='mt-8 h-11.5 w-full' />
        <Skeleton className='mt-8 h-11.5 w-full' />
        <Skeleton className='h-11 w-full' />
      </section>
    </div>
  </div>
);

const EmptyPortfolio = () => (
  <section className='lg:flex lg:min-h-88.75 lg:items-center lg:justify-center lg:rounded-xl lg:border lg:border-invest-divider lg:bg-invest-surface lg:px-4 lg:text-center'>
    <div className='lg:-translate-y-2.5'>
      <span className='mx-auto hidden size-10 place-items-center rounded-invest-button bg-invest-raised text-invest-muted lg:grid'>
        <Icon name='wallet' className='size-5.5' />
      </span>
      <h2 className='text-invest-section lg:mt-2.25 lg:text-invest-block'>Портфель пока пуст</h2>
      <p className='mt-1.25 max-w-80 text-invest-caption text-invest-muted lg:max-w-none'>
        Добавьте первую покупку, чтобы увидеть стоимость и доли монет.
      </p>
    </div>
  </section>
);

export const PortfolioPage = () => {
  const p = usePortfolioPage();
  if (p.pending) return <PortfolioPending />;

  return (
    <div className='pt-5.5 pb-4 lg:pt-7.25'>
      <header className={`relative ${p.mobileAdd ? "hidden lg:block" : ""}`}>
        <h1 className='text-invest-mobile-title lg:text-invest-title'>Мой портфель</h1>
        <p className='mt-2.25 flex items-center gap-1.75 text-invest-caption text-invest-muted lg:mt-1.25'>
          <Icon name='lock' />
          Покупки хранятся в этом браузере
        </p>
        <p className='mt-1.25 text-invest-caption text-invest-muted lg:hidden'>Демо-данные</p>
        <SegmentedControl
          aria-label='Валюта портфеля'
          className='absolute -top-0.5 right-0 w-26.5 lg:top-3 lg:w-36'
        >
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
          className='-mt-2.75 mb-2.25 flex h-11 justify-start lg:hidden'
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
            className={`mb-3 min-h-11.5 items-center gap-2.25 pl-3 text-invest-label ${p.mobileAdd ? "hidden lg:flex" : "flex"}`}
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

        <div className={p.readFailed ? "lg:max-w-89" : grid}>
          {!p.readFailed && (
            <div className={p.mobileAdd ? "hidden lg:block" : ""}>
              {p.purchases.length === 0 ? (
                <EmptyPortfolio />
              ) : (
                <>
                  <Button
                    ref={p.mobileAddButton}
                    variant='primary'
                    onClick={p.openPurchase}
                    disabled={!p.writable}
                    className='relative mb-4 h-11 w-full lg:hidden'
                  >
                    <Icon name='plus' className='absolute left-3' />
                    Добавить покупку
                  </Button>
                  <PurchaseList purchases={p.purchases} coins={p.coins} />
                </>
              )}
            </div>
          )}
          <PurchaseForm
            className={
              p.mobileAdd || p.readFailed || p.purchases.length === 0 ? "" : "hidden lg:block"
            }
            mobileAdd={p.mobileAdd}
            mobileHeading={p.mobileHeading}
            onEdit={p.editPurchase}
            onSaved={p.finishPurchase}
          />
        </div>
      </div>
    </div>
  );
};
