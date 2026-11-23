import { useLayoutEffect } from "react";
import { useLoaderData } from "react-router";

import type { loadHome } from "../api";
import { useHomeStore } from "../homeStore";

export const useHome = () => {
  const data = useLoaderData<typeof loadHome>();
  const state = useHomeStore();

  useLayoutEffect(() => {
    const { setInitialData, stop } = useHomeStore.getState();
    setInitialData(data);

    return stop;
  }, [data]);

  return state.initial === data ? state : null;
};
