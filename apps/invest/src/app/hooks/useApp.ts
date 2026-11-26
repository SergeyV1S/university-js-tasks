import { matchPath, useLocation, useNavigation } from "react-router";
import type { NavLinkRenderProps } from "react-router";

import { PATHS } from "@/shared/constants";

import { getPendingRoute } from "../helpers";

const navLink =
  "flex h-11 items-center justify-center gap-2 rounded-lg text-invest-label transition-colors motion-reduce:transition-none";
const activeNavLink = "bg-invest-selected text-invest-accent inset-ring inset-ring-invest-divider";
const inactiveNavLink = "text-invest-muted hover:bg-invest-raised hover:text-invest-foreground";

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
    return `${navLink} px-2.5 lg:px-4 ${active ? activeNavLink : inactiveNavLink}`;
  };
  const portfolioLinkClass = ({ isActive }: NavLinkRenderProps) => {
    const active = portfolioPending || (isActive && !coinPending && !homePending);
    return `${navLink} px-2.5 lg:px-4 ${active ? activeNavLink : inactiveNavLink}`;
  };

  return {
    Pending: pendingRoute?.HydrateFallback,
    showDemoData,
    marketLinkClass,
    portfolioLinkClass
  };
};
