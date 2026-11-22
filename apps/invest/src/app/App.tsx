import { NavLink, Outlet } from "react-router";

import { CoinPending } from "../pages/coin";
import { HomePending } from "../pages/home";
import { PATHS } from "../shared/constants/router-paths";
import { Icon } from "../shared/ui/Icon";
import { useApp } from "./hooks/useApp";

const navLink = "flex h-11 items-center justify-center gap-2.5 rounded-lg text-invest-label lg:relative lg:h-18 lg:justify-start lg:rounded-none lg:px-3.5";
const activeNavLink = "bg-invest-selected text-invest-accent lg:bg-transparent lg:after:absolute lg:after:inset-x-2 lg:after:bottom-0 lg:after:h-0.5 lg:after:rounded-full lg:after:bg-invest-accent";
const gutters = "mx-auto w-full max-w-384 px-4 lg:px-12";

export const App = () => {
  const { isHome, isCoin, homePending, coinPending } = useApp();
  const showDemoData = isHome || isCoin || homePending || coinPending;

  return (
    <>
      <header className="relative bg-invest-navigation after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:border-b after:border-invest-divider">
        <div className={`${gutters} flex h-15.5 items-center justify-between lg:h-18 lg:justify-start`}>
          <span className="flex items-center gap-2.5 text-invest-section">
            <span className="grid size-8 place-items-center rounded-lg bg-invest-accent text-invest-accent-ink"><Icon name="logo" /></span>
            Invest
          </span>
          <nav className="z-10 flex shrink-0 gap-0.75 lg:ml-9 lg:gap-1.5" aria-label="Основная навигация">
            <NavLink to={PATHS.HOME} end className={({ isActive }) => `${navLink} w-18.5 lg:w-27.25 ${isActive || isCoin || coinPending ? activeNavLink : "text-invest-muted"}`}>
              <Icon name="market" className="hidden lg:block" />
              Рынок
            </NavLink>
            <NavLink to={PATHS.PORTFOLIO} end className={({ isActive }) => `${navLink} w-25 lg:w-31.5 ${isActive && !coinPending ? activeNavLink : "text-invest-muted"}`}>
              <Icon name="wallet" className="hidden lg:block" />
              Портфель
            </NavLink>
          </nav>
          {showDemoData && (
            <span className="ml-auto hidden h-8 w-36.5 items-center justify-center rounded-[7px] border border-invest-divider bg-invest-surface text-invest-caption text-invest-muted lg:flex"
              title="Источник котировок: CoinGecko Demo API">
              Демо-данные
            </span>
          )}
        </div>
      </header>
      <main className={gutters}>
        {coinPending ? <CoinPending /> : homePending ? <HomePending /> : <Outlet />}
      </main>
    </>
  );
};
