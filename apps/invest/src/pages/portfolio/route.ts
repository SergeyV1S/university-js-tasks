import type { RouteObject } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";
import { PortfolioPage } from "./page";

export const portfolioRoute = {
  path: PATHS.PORTFOLIO,
  Component: PortfolioPage
} satisfies RouteObject;
