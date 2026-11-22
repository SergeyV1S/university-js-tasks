import { useLocation, useNavigation } from "react-router";

import { PATHS } from "../../shared/constants/router-paths";

export const useApp = () => {
  const { pathname } = useLocation();
  const navigation = useNavigation();
  const isHome = pathname === PATHS.HOME;
  const homePending = !isHome && navigation.location?.pathname === PATHS.HOME;

  return { isHome, homePending };
};
