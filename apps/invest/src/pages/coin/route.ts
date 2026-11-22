import type { LoaderFunctionArgs, RouteObject } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";
import { loadCoin } from "./api";
import { CoinPage, CoinPending } from "./page";

export const coinRoute = {
  path: PATHS.COIN,
  Component: CoinPage,
  HydrateFallback: CoinPending,
  loader: ({ params, request }: LoaderFunctionArgs) => loadCoin(params.coinId ?? "", request.signal)
} satisfies RouteObject;
