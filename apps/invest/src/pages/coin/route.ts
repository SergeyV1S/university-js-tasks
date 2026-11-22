import type { RouteObject } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";
import { CoinPage } from "./page";

export const coinRoute = {
  path: PATHS.COIN,
  Component: CoinPage,
} satisfies RouteObject;
