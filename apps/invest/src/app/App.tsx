import { NavLink, Outlet } from "react-router";

import { PATHS } from "../shared/constants/router-paths";

export const App = () => (
  <>
    <header className="app-header">
      <div className="layout header-content">
        <span className="wordmark">Invest</span>
        <nav className="app-nav" aria-label="Основная навигация">
          <NavLink to={PATHS.HOME} end>
            Главная
          </NavLink>
          <NavLink to={PATHS.PORTFOLIO} end>
            Портфель
          </NavLink>
        </nav>
      </div>
    </header>
    <main className="layout screen">
      <Outlet />
    </main>
  </>
);
