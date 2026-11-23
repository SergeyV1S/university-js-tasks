import { useLayoutEffect } from "react";
import { useLoaderData, useNavigate } from "react-router";

import { PATHS } from "@/shared/constants/router-paths";
import { useNoticeDismissal } from "@/shared/hooks/useNoticeDismissal";
import { marketNotice, selectMarketError } from "@/shared/market/notice";
import { isRecoverableMarketError } from "@/shared/market/resource";

import type { loadCoin } from "../api";
import { useCoinStore } from "../coinStore";

export const useCoinPage = () => {
  const data = useLoaderData<typeof loadCoin>();
  const initial = useCoinStore((state) => state.initial);
  const details = useCoinStore((state) => state.details);
  const market = useCoinStore((state) => state.market);
  const historyError = useCoinStore((state) => state.history?.error);
  const quotes = useCoinStore((state) => state.quotes);
  const rates = useCoinStore((state) => state.rates);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const { setInitialData, stop } = useCoinStore.getState();
    setInitialData(data);
    return stop;
  }, [data]);

  const openMarket = () => {
    void navigate(PATHS.HOME);
  };

  const status = details?.data?.status ?? "error";
  const identity = details?.data?.status === "ready" ? details.data.identity : undefined;
  const coin = identity && {
    ...identity,
    symbol: identity.symbol ?? market?.data?.symbol,
    image: market?.data?.image,
    rank: market?.data?.rank ?? null,
    price: market?.data?.price ?? quotes?.data?.USD ?? null,
    change24h: market?.data?.change24h ?? null,
    marketCap: market?.data?.marketCap ?? null
  };
  const error = selectMarketError(
    details?.error,
    quotes?.error,
    rates?.error,
    market?.error,
    isRecoverableMarketError(historyError) ? historyError : null
  );

  const { visible, dismiss } = useNoticeDismissal(error?.kind);

  return {
    dismiss,
    pending: initial !== data || !details,
    status,
    coin,
    notice:
      error &&
      visible &&
      marketNotice(
        error,
        details?.error ? "Не удалось загрузить список монет" : "Не удалось загрузить котировки",
        Boolean((quotes?.error && quotes.data) || (rates?.error && rates.data)),
        "Показываем последние полученные курсы."
      ),
    openMarket
  };
};
