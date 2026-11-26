import { matchPath, useLocation, useNavigation } from "react-router";
import type { NavLinkRenderProps } from "react-router";

import { PATHS } from "@/shared/constants";

import { getPendingRoute } from "../helpers";

const navLink =
  "flex h-11 items-center justify-center gap-2.5 rounded-lg text-invest-label lg:relative lg:h-18 lg:justify-start lg:rounded-none lg:px-3.5";
const activeNavLink =
  "bg-invest-selected text-invest-accent lg:bg-transparent lg:after:absolute lg:after:inset-x-2 lg:after:bottom-0 lg:after:h-0.5 lg:after:rounded-full lg:after:bg-invest-accent";

export const useApp = () => {
  const { pathname } = useLocation();
  const { location } = useNavigation();
  const pendingRoute = getPendingRoute(pathname, location?.pathname);
  const homePending = pendingRoute?.path === PATHS.HOME;
  const portfolioPending = pendingRoute?.path === PATHS.PORTFOLIO;
  const coinPending = pendingRoute?.path === PATHS.COIN;
  const isCoin = matchPath(PATHS.COIN, pathname) !== null;
  const showDemoData =
    Boolean(pendingRoute) || isCoin || pathname === PATHS.HOME || pathname === PATHS.PORTFOLIO;

  const marketLinkClass = ({ isActive }: NavLinkRenderProps) => {
    const active = !portfolioPending && (isActive || isCoin || coinPending);
    return `${navLink} w-18.5 lg:w-27.25 ${active ? activeNavLink : "text-invest-muted"}`;
  };
  const portfolioLinkClass = ({ isActive }: NavLinkRenderProps) => {
    const active = portfolioPending || (isActive && !coinPending && !homePending);
    return `${navLink} w-25 lg:w-31.5 ${active ? activeNavLink : "text-invest-muted"}`;
  };

  return {
    Pending: pendingRoute?.HydrateFallback,
    showDemoData,
    marketLinkClass,
    portfolioLinkClass
  };
};
