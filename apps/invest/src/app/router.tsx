import { createBrowserRouter } from "react-router";

import { coinRoute } from "../pages/coin";
import { homeFallbackRoute, homeRoute } from "../pages/home";
import { portfolioRoute } from "../pages/portfolio";
import { App } from "./App";

export const router = createBrowserRouter([
  {
    Component: App,
    children: [homeRoute, coinRoute, portfolioRoute, homeFallbackRoute],
  },
]);
