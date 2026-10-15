import { useEffect } from "react";
import { THEMES } from "@/shared/constants";
import { applyTheme } from "../helpers/theme";
import { useThemeState } from "./useThemeState";

export const useTheme = () => {
  const themeState = useThemeState();

  useEffect(() => {
    applyTheme(themeState.state.theme);
  }, [themeState.state.theme]);

  const toggleTheme = () => {
    themeState.functions.setTheme((current) =>
      current === THEMES.dark ? THEMES.light : THEMES.dark
    );
  };

  return {
    state: {
      theme: themeState.state.theme,
      isDark: themeState.state.theme === THEMES.dark
    },
    functions: { toggleTheme }
  };
};
