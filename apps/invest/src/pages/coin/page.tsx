import { Link } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";
import { Banner } from "../../shared/ui/Banner";
import { Button } from "../../shared/ui/Button";
import { Icon } from "../../shared/ui/Icon";
import { CoinConverter } from "./components/CoinConverter";
import { CoinHeader } from "./components/CoinHeader";
import { CoinHistory } from "./components/CoinHistory";
import { useCoinPage } from "./hooks/useCoinPage";

const detailsLayout = "mt-3.75 grid items-start gap-3.5 lg:mt-5.25 lg:grid-cols-[minmax(0,1fr)_21.25rem] lg:gap-5";

const MarketLink = () => (
  <Link to={PATHS.HOME} className="inline-flex h-11 w-45 items-center gap-1.75 rounded-sm text-invest-label text-invest-muted hover:text-invest-foreground">
    <Icon name="back" />
    Все криптовалюты
  </Link>
);

export const CoinPending = () => (
  <div className="pt-1.75 pb-4 lg:pt-4">
    <MarketLink />
    <div role="status" aria-label="Загрузка данных монеты" aria-busy="true">
      <CoinHeader />
      <div className={detailsLayout}>
        <CoinHistory pending />
        <CoinConverter />
      </div>
    </div>
  </div>
);

export const CoinPage = () => {
  const { data, openMarket } = useCoinPage();

  if (!data) return <CoinPending />;

  return (
    <div className="pt-1.75 pb-4 lg:pt-4">
      <MarketLink />
      {data.status === "ready" ? (
        <>
          <CoinHeader coin={data.coin} />
          <div className={detailsLayout}>
            <CoinHistory />
            <CoinConverter coin={data.coin} data={data.converter} />
          </div>
          {(data.marketError || data.converter.quotes === null || data.converter.rates === null) && (
            <Banner role="alert" className="mt-6 flex items-center gap-2.5 px-3 py-2.5 text-invest-label">
              <Icon name="alert" />
              {data.converter.quotes === null || data.converter.rates === null
                ? "Не удалось загрузить котировки"
                : "Не удалось загрузить статистику монеты"}
            </Banner>
          )}
        </>
      ) : (
        <section role={data.status === "error" ? "alert" : undefined}
          className="mt-5.25 flex min-h-68 flex-col items-center justify-center rounded-xl border border-invest-divider bg-invest-surface px-4 pb-2 text-center lg:min-h-97.5">
          <span className="grid size-10 place-items-center rounded-invest-button bg-invest-raised text-invest-muted">
            {data.status === "not-found" ? <Icon name="search" className="size-5.5" /> : <Icon name="alert" className="size-5 text-invest-warning" />}
          </span>
          <h1 className="mt-2.25 text-invest-block">{data.status === "not-found" ? "Монета не найдена" : "Данные временно недоступны"}</h1>
          <p className="mt-1.25 text-invest-caption text-invest-muted">
            {data.status === "not-found" ? "Проверьте адрес или выберите монету в списке." : "Не удалось загрузить список монет."}
          </p>
          <Button variant="primary" onClick={openMarket} className="mt-4.5 h-10 w-36.25">На главную</Button>
        </section>
      )}
    </div>
  );
};
