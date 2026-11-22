import { useLayoutEffect } from "react";
import { useLoaderData, useNavigate } from "react-router";

import { PATHS } from "../../../shared/constants/router-paths";
import type { loadCoin } from "../api";
import { useCoinStore } from "../coinStore";

export const useCoinPage = () => {
  const data = useLoaderData<typeof loadCoin>();
  const initial = useCoinStore((state) => state.initial);
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const { setInitialData, stop } = useCoinStore.getState();
    setInitialData(data);
    return stop;
  }, [data]);

  const openMarket = () => { void navigate(PATHS.HOME); };

  return { data: initial === data ? data : null, openMarket };
};
