import { useLayoutEffect } from "react";
import { useLoaderData } from "react-router";

import type { loadHome } from "../actions";
import { useHomeStore } from "../store";

export const useHome = () => {
  const data = useLoaderData<typeof loadHome>();
  const state = useHomeStore();

  useLayoutEffect(() => {
    const { setInitialData, startPolling, stop } = useHomeStore.getState();
    setInitialData(data);
    startPolling();

    return stop;
  }, [data]);

  return state.initial === data ? state : null;
};
