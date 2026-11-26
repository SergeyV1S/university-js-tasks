import type { LoaderFunctionArgs, RouteObject } from "react-router";

import { PATHS } from "@/shared/constants";

import { loadPortfolio } from "./actions";
import { PortfolioPage, PortfolioPending } from "./page";
import { usePortfolioStore } from "./store";

export const portfolioRoute = {
  path: PATHS.PORTFOLIO,
  Component: PortfolioPage,
  HydrateFallback: PortfolioPending,
  loader: ({ request }: LoaderFunctionArgs) =>
    loadPortfolio(request.signal, usePortfolioStore.getState().currency)
} satisfies RouteObject;
