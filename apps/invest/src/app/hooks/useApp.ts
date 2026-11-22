import { matchPath, useLocation, useNavigation } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";

export const useApp = () => {
  const { pathname } = useLocation();
  const { location } = useNavigation();
  const isHome = pathname === PATHS.HOME;
  const isCoin = matchPath(PATHS.COIN, pathname) !== null;
  const homePending = !isHome && location?.pathname === PATHS.HOME;
  const coinPending = location !== undefined && location.pathname !== pathname && matchPath(PATHS.COIN, location.pathname) !== null;

  return { isHome, isCoin, homePending, coinPending };
};
