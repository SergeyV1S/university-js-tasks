import { replace } from "react-router";
import type { LoaderFunctionArgs, RouteObject } from "react-router";

import { PATHS } from "@/shared/constants";

import { loadHome } from "./actions";
import { HomePage, HomePending } from "./page";

export const homeRoute = {
  path: PATHS.HOME,
  Component: HomePage,
  HydrateFallback: HomePending,
  loader: ({ request }: LoaderFunctionArgs) => loadHome(request.signal)
} satisfies RouteObject;

export const homeFallbackRoute = {
  path: PATHS.FALLBACK,
  loader: () => replace(PATHS.HOME)
} satisfies RouteObject;
