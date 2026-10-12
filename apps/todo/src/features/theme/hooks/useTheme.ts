import { useEffect } from "react";
import { STORAGE_KEYS, THEMES, type Theme } from "@/shared/constants";
import { useLocalStorage } from "@/shared/hooks";
import { applyTheme, getSystemTheme } from "../helpers/theme";

export const useTheme = () => {
  const themeStorage = useLocalStorage<Theme>(STORAGE_KEYS.theme, getSystemTheme);

  useEffect(() => {
    applyTheme(themeStorage.state.value);
  }, [themeStorage.state.value]);

  const toggleTheme = () => {
    themeStorage.functions.setValue((current) =>
      current === THEMES.dark ? THEMES.light : THEMES.dark
    );
  };

  return {
    state: {
      theme: themeStorage.state.value,
      isDark: themeStorage.state.value === THEMES.dark
    },
    functions: { toggleTheme }
  };
};
