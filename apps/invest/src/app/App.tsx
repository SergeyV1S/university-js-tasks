import { NavLink, Outlet } from "react-router";

import { PATHS } from "@/shared/constants";
import { Icon } from "@/shared/ui";

import { useApp } from "./hooks";

const gutters = "mx-auto w-full max-w-384 px-4";

export const App = () => {
  const { Pending, showDemoData, marketLinkClass, portfolioLinkClass } = useApp();

  return (
    <>
      <header className='relative bg-invest-navigation after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:border-b after:border-invest-divider'>
        <div
          className={`${gutters} flex h-15.5 items-center justify-between lg:h-18 lg:justify-start`}
        >
          <span className='flex items-center gap-2.5 text-invest-section'>
            <span className='grid size-8 place-items-center rounded-lg bg-invest-accent text-invest-accent-ink'>
              <Icon name='logo' />
            </span>
            Invest
          </span>
          <nav
            className='z-10 flex shrink-0 gap-0.75 lg:ml-9 lg:gap-1.5'
            aria-label='Основная навигация'
          >
            <NavLink to={PATHS.HOME} end className={marketLinkClass}>
              <Icon name='market' className='hidden lg:block' />
              Рынок
            </NavLink>
            <NavLink to={PATHS.PORTFOLIO} end className={portfolioLinkClass}>
              <Icon name='wallet' className='hidden lg:block' />
              Портфель
            </NavLink>
          </nav>
          {showDemoData && (
            <span
              className='ml-auto hidden h-8 w-36.5 items-center justify-center rounded-[7px] border border-invest-divider bg-invest-surface text-invest-caption text-invest-muted lg:flex'
              title='Источник котировок: CoinGecko Demo API'
            >
              Демо-данные
            </span>
          )}
        </div>
      </header>
      <main className={gutters}>{Pending ? <Pending /> : <Outlet />}</main>
    </>
  );
};
