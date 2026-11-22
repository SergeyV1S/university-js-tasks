import { useSyncExternalStore } from "react";

import { readRoute } from "./routes.js";

function subscribeToHashChange(onChange) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getHash() {
  return window.location.hash;
}

function CoinPage({ coinId }) {
  return (
    <>
      <h1>Детали монеты</h1>
      <p className="coin-id">{coinId}</p>
    </>
  );
}

function Screen({ route }) {
  switch (route.screen) {
    case "coin":
      return <CoinPage coinId={route.coinId} />;
    case "portfolio":
      return <h1>Портфель</h1>;
    default:
      return <h1>Главная</h1>;
  }
}

export function App() {
  const hash = useSyncExternalStore(subscribeToHashChange, getHash);
  const route = readRoute(hash);

  return (
    <>
      <header className="app-header">
        <div className="layout header-content">
          <span className="wordmark">Invest</span>
          <nav className="app-nav" aria-label="Основная навигация">
            <a href="#/" aria-current={route.screen === "home" ? "page" : undefined}>
              Главная
            </a>
            <a
              href="#/portfolio"
              aria-current={route.screen === "portfolio" ? "page" : undefined}
            >
              Портфель
            </a>
          </nav>
        </div>
      </header>
      <main className="layout screen">
        <Screen route={route} />
      </main>
    </>
  );
}
