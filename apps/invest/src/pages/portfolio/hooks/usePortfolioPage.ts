import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { useLoaderData } from "react-router";

import { useNoticeDismissal } from "@/shared/hooks";
import { isRecoverableMarketError, marketNotice, selectMarketError } from "@/shared/market";

import type { loadPortfolio } from "../actions";
import { calculateValuation, getOwnedCoins, getPurchaseFormPlacement } from "../helpers";
import { usePortfolioStore } from "../store";
import type { Purchase } from "../types";

const emptyPurchases: Purchase[] = [];

export const usePortfolioPage = () => {
  const data = useLoaderData<typeof loadPortfolio>();
  const initial = usePortfolioStore((state) => state.initial);
  const snapshot = usePortfolioStore((state) => state.snapshot);
  const coins = usePortfolioStore((state) => state.coins);
  const catalog = usePortfolioStore((state) => state.catalog);
  const prices = usePortfolioStore((state) => state.prices);
  const loadingQuotes = usePortfolioStore((state) => state.loadingQuotes);
  const priceError = usePortfolioStore((state) => state.priceError);
  const coinsError = usePortfolioStore((state) => state.coinsError);
  const catalogError = usePortfolioStore((state) => state.catalogError);
  const currency = usePortfolioStore((state) => state.currency);
  const writable = usePortfolioStore((state) => state.writable);
  const readFailed = usePortfolioStore((state) => state.readFailed);
  const saving = usePortfolioStore((state) => state.saveStatus === "saving");
  const saved = usePortfolioStore((state) => state.saveStatus === "saved");
  const retryRead = usePortfolioStore((state) => state.retryRead);
  const dismissSuccess = usePortfolioStore((state) => state.dismissSuccess);
  const [mobileView, setMobileView] = useState<{ add: boolean; animate?: boolean } | null>(null);
  const mobileHeading = useRef<HTMLHeadingElement>(null);
  const mobileAddButton = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const { setInitialData, close } = usePortfolioStore.getState();
    setInitialData(data);
    return close;
  }, [data]);

  useLayoutEffect(() => {
    if (!mobileView) return;

    const target = mobileView.add ? mobileHeading.current : mobileAddButton.current;
    if (!target?.getClientRects().length) return;

    target.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [mobileView]);

  const chooseRub = () => usePortfolioStore.getState().setCurrency("RUB");
  const chooseUsd = () => usePortfolioStore.getState().setCurrency("USD");
  const openPurchase = (event: MouseEvent<HTMLButtonElement>) =>
    setMobileView({ add: true, animate: event.detail > 0 });
  const closePurchase = () => setMobileView({ add: false });

  const purchases = snapshot?.purchases ?? emptyPurchases;
  const hasPurchases = purchases.length > 0;
  const mobileAdd = mobileView?.add ?? false;
  const purchaseFormPlacement = getPurchaseFormPlacement(readFailed, hasPurchases, mobileAdd);
  const valuation = useMemo(
    () => calculateValuation(purchases, prices, currency),
    [purchases, prices, currency]
  );
  const ownedCoins = useMemo(
    () => getOwnedCoins(purchases, coins, catalog),
    [coins, catalog, purchases]
  );

  const valuationStale = Boolean(priceError && valuation.kind === "ready");
  const marketError = selectMarketError(priceError, coinsError, catalogError);
  const { visible, dismiss } = useNoticeDismissal(marketError?.kind);
  const notice =
    marketError && visible && isRecoverableMarketError(marketError)
      ? marketNotice(
          marketError,
          "Не удалось загрузить рыночные данные",
          valuationStale,
          "Показываем последние полученные котировки."
        )
      : undefined;

  return {
    notice,
    dismissMarketNotice: dismiss,
    valuationStale,
    valuationUnavailable: Boolean(priceError && valuation.kind === "missing"),
    pending: data !== initial,
    purchases,
    hasPurchases,
    ownedCoins,
    valuation,
    valuationLoading: loadingQuotes && !priceError && valuation.kind === "missing",
    currency,
    readFailed,
    writable,
    saving,
    saved,
    mobileAdd,
    purchaseFormPlacement,
    animateMobilePurchase: mobileView?.animate ?? false,
    mobileHeading,
    mobileAddButton,
    retryRead,
    dismissSuccess,
    chooseRub,
    chooseUsd,
    openPurchase,
    closePurchase
  };
};
