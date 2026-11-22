import { replace } from "react-router";
import type { RouteObject } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";
import { HomePage } from "./page";

export const homeRoute = {
  path: PATHS.HOME,
  Component: HomePage,
} satisfies RouteObject;

export const homeFallbackRoute = {
  path: PATHS.FALLBACK,
  loader: () => replace(PATHS.HOME),
} satisfies RouteObject;
