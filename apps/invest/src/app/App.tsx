import { NavLink, Outlet } from "react-router";

import { HomePending } from "../pages/home";
import { PATHS } from "../shared/constants/router-paths";
import { Icon } from "../shared/ui/Icon";
import { useApp } from "./hooks/useApp";

const navLink = "flex h-11 items-center justify-center gap-2.5 rounded-lg text-invest-label text-invest-muted aria-[current=page]:bg-invest-selected aria-[current=page]:text-invest-accent lg:relative lg:h-18 lg:justify-start lg:rounded-none lg:px-3.5 lg:aria-[current=page]:bg-transparent lg:aria-[current=page]:after:absolute lg:aria-[current=page]:after:inset-x-2 lg:aria-[current=page]:after:bottom-0 lg:aria-[current=page]:after:h-0.5 lg:aria-[current=page]:after:rounded-full lg:aria-[current=page]:after:bg-invest-accent";
const gutters = "mx-auto w-full max-w-384 px-4 lg:px-12";

export const App = () => {
  const { isHome, homePending } = useApp();

  return (
    <>
      <header className="relative bg-invest-navigation after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:border-b after:border-invest-divider">
        <div className={`${gutters} flex h-15.5 items-center justify-between lg:h-18 lg:justify-start`}>
          <span className="flex items-center gap-2.5 text-invest-section">
            <span className="grid size-8 place-items-center rounded-lg bg-invest-accent text-invest-accent-ink"><Icon name="logo" /></span>
            Invest
          </span>
          <nav className="z-10 flex shrink-0 gap-0.75 lg:ml-8.5 lg:gap-1.5" aria-label="Основная навигация">
            <NavLink to={PATHS.HOME} end className={`${navLink} w-18.5 lg:w-27.25`}>
              <Icon name="market" className="hidden lg:block" />
              Рынок
            </NavLink>
            <NavLink to={PATHS.PORTFOLIO} end className={`${navLink} w-25 lg:w-31.5`}>
              <Icon name="wallet" className="hidden lg:block" />
              Портфель
            </NavLink>
          </nav>
          {isHome && (
            <span className="ml-auto hidden h-8 w-36.5 items-center justify-center rounded-[7px] border border-invest-divider bg-invest-surface text-invest-caption text-invest-muted lg:flex"
              title="Источник котировок: CoinGecko Demo API">
              Демо-данные
            </span>
          )}
        </div>
      </header>
      <main className={gutters}>
        {homePending ? <HomePending /> : <Outlet />}
      </main>
    </>
  );
};
