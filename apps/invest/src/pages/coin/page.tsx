import { Link } from "react-router";

import { PATHS } from "@/shared/constants";
import { ButtonLink, Icon, Notice } from "@/shared/ui";

import { CoinConverter, CoinHeader, CoinHistory } from "./components";
import { useCoinPage } from "./hooks";

const detailsLayout =
  "mt-3.75 grid items-start gap-3.5 lg:mt-5.25 lg:grid-cols-[minmax(0,1fr)_21.25rem] lg:gap-5";

const MarketLink = () => (
  <Link
    to={PATHS.HOME}
    className='invest-back-link inline-flex h-11 w-45 items-center gap-1.75 rounded-sm text-invest-label text-invest-muted hover:text-invest-foreground'
  >
    <Icon name='back' className='invest-back-icon' />
    Все криптовалюты
  </Link>
);

export const CoinPending = () => (
  <div className='pt-1.75 pb-4 lg:pt-4'>
    <MarketLink />
    <div role='status' aria-label='Загрузка данных монеты' aria-busy='true'>
      <CoinHeader />
      <div className={detailsLayout}>
        <CoinHistory pending />
        <CoinConverter />
      </div>
    </div>
  </div>
);

export const CoinPage = () => {
  const { pending, status, coin, notice, dismiss } = useCoinPage();

  if (pending) return <CoinPending />;

  return (
    <div className='pt-1.75 pb-4 lg:pt-4'>
      <MarketLink />
      {coin ? (
        <>
          <CoinHeader coin={coin} />
          <div className={detailsLayout}>
            <CoinHistory />
            <CoinConverter coin={coin} />
          </div>
        </>
      ) : (
        <section className='mt-5.25 flex min-h-68 flex-col items-center justify-center rounded-xl border border-invest-divider bg-invest-surface px-4 pb-2 text-center lg:min-h-97.5'>
          <span className='grid size-10 place-items-center rounded-invest-button bg-invest-raised text-invest-muted'>
            {status === "not-found" ? (
              <Icon name='search' className='size-5.5' />
            ) : (
              <Icon name='alert' className='size-5 text-invest-warning' />
            )}
          </span>
          <h1 className='mt-2.25 text-invest-block'>
            {status === "not-found" ? "Монета не найдена" : "Данные временно недоступны"}
          </h1>
          <p className='mt-1.25 text-invest-caption text-invest-muted'>
            {status === "not-found"
              ? "Проверьте адрес или выберите монету в списке."
              : "Не удалось загрузить список монет."}
          </p>
          <ButtonLink to={PATHS.HOME} variant='primary' className='mt-4.5 h-10 w-36.25'>
            На главную
          </ButtonLink>
        </section>
      )}
      {notice && <Notice {...notice} className='mt-6.75' onDismiss={dismiss} />}
    </div>
  );
};
