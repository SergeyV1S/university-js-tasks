import { NavLink, Outlet } from "react-router";

import { PATHS } from "@/shared/constants";
import { Icon } from "@/shared/ui";

import { useApp } from "./hooks";

const gutters = "mx-auto w-full max-w-336 px-4 sm:px-6 lg:px-8";

export const App = () => {
  const { Pending, showDemoData, marketLinkClass, portfolioLinkClass } = useApp();

  return (
    <>
      <a href='#invest-main' className='invest-skip-link'>
        К содержимому
      </a>
      <header className='border-b border-invest-divider bg-invest-navigation'>
        <div
          className={`${gutters} flex h-16 items-center justify-between lg:h-18 lg:justify-start`}
        >
          <span translate='no' className='flex items-center gap-2.5 text-invest-section'>
            <span className='invest-brand-mark grid size-8 place-items-center rounded-lg text-invest-accent'>
              <Icon name='logo' />
            </span>
            Invest
          </span>
          <nav className='flex shrink-0 gap-0.5 lg:ml-9 lg:gap-1.5' aria-label='Основная навигация'>
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
              className='ml-auto hidden items-center gap-2 text-invest-caption text-invest-muted lg:flex'
              title='Источник котировок: CoinGecko Demo API'
            >
              <span aria-hidden='true' className='size-1.5 rounded-full bg-invest-accent' />
              Демо-данные
            </span>
          )}
        </div>
      </header>
      <main id='invest-main' tabIndex={-1} className={gutters}>
        {Pending ? <Pending /> : <Outlet />}
      </main>
    </>
  );
};
