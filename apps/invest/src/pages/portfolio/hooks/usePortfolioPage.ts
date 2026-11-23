import { useLayoutEffect, useRef, useState } from "react";
import { useLoaderData } from "react-router";

import type { loadPortfolio } from "../api";
import { usePortfolioStore } from "../portfolioStore";

export const usePortfolioPage = () => {
  const data = useLoaderData<typeof loadPortfolio>();
  const initial = usePortfolioStore((state) => state.initial);
  const snapshot = usePortfolioStore((state) => state.snapshot);
  const coins = usePortfolioStore((state) => state.coins);
  const currency = usePortfolioStore((state) => state.currency);
  const writable = usePortfolioStore((state) => state.writable);
  const readFailed = usePortfolioStore((state) => state.readFailed);
  const saving = usePortfolioStore((state) => state.saveStatus === "saving");
  const saved = usePortfolioStore((state) => state.saveStatus === "saved");
  const retryRead = usePortfolioStore((state) => state.retryRead);
  const dismissSuccess = usePortfolioStore((state) => state.dismissSuccess);
  const [mobileView, setMobileView] = useState<"auto" | "form" | "overview">("auto");
  const [hasDraft, setHasDraft] = useState(false);
  const mobileHeading = useRef<HTMLHeadingElement>(null);
  const mobileAddButton = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const { setInitialData, close } = usePortfolioStore.getState();
    setInitialData(data);
    return close;
  }, [data]);

  useLayoutEffect(() => {
    if (mobileView === "form") mobileHeading.current?.focus();
    if (mobileView === "overview") mobileAddButton.current?.focus();
  }, [mobileView]);

  const chooseRub = () => usePortfolioStore.getState().setCurrency("RUB");
  const chooseUsd = () => usePortfolioStore.getState().setCurrency("USD");
  const openPurchase = () => setMobileView("form");
  const editPurchase = () => setHasDraft(true);
  const closePurchase = () => setMobileView("overview");
  const finishPurchase = () => {
    setHasDraft(false);
    closePurchase();
  };

  const purchases = snapshot?.purchases ?? [];
  const mobileAdd =
    mobileView === "form" ||
    (mobileView === "auto" && hasDraft && purchases.length > 0 && !readFailed);

  return {
    pending: data !== initial,
    purchases,
    coins,
    currency,
    readFailed,
    writable,
    saving,
    saved,
    mobileAdd,
    mobileHeading,
    mobileAddButton,
    retryRead,
    dismissSuccess,
    chooseRub,
    chooseUsd,
    openPurchase,
    editPurchase,
    closePurchase,
    finishPurchase
  };
};
