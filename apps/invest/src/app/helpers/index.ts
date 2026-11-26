import { matchPath } from "react-router";

import { coinRoute } from "@/pages/coin";
import { homeRoute } from "@/pages/home";
import { portfolioRoute } from "@/pages/portfolio";
import { PATHS } from "@/shared/constants";

export const getPendingRoute = (current: string, next?: string) => {
  if (next === undefined || next === current) return;
  if (next === PATHS.HOME) return homeRoute;
  if (next === PATHS.PORTFOLIO) return portfolioRoute;
  if (matchPath(PATHS.COIN, next)) return coinRoute;
};
