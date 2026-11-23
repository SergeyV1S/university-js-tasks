import type { LoaderFunctionArgs, RouteObject } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";
import { loadPortfolio } from "./api";
import { PortfolioPage, PortfolioPending } from "./page";

export const portfolioRoute = {
  path: PATHS.PORTFOLIO,
  Component: PortfolioPage,
  HydrateFallback: PortfolioPending,
  loader: ({ request }: LoaderFunctionArgs) => loadPortfolio(request.signal)
} satisfies RouteObject;
