import type { LoaderFunctionArgs, RouteObject } from "react-router";

import { PATHS } from "@/shared/constants/router-paths";

import { loadPortfolio } from "./api";
import { PortfolioPage, PortfolioPending } from "./page";
import { usePortfolioStore } from "./portfolioStore";

export const portfolioRoute = {
  path: PATHS.PORTFOLIO,
  Component: PortfolioPage,
  HydrateFallback: PortfolioPending,
  loader: ({ request }: LoaderFunctionArgs) =>
    loadPortfolio(request.signal, usePortfolioStore.getState().currency)
} satisfies RouteObject;
