import { STORAGE_KEYS, THEMES, type Theme } from "@/shared/constants";
import { storage } from "@/shared/utils";

export const getSystemTheme = () =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? THEMES.dark : THEMES.light;

export const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === THEMES.dark);
};

export const initTheme = () => {
  applyTheme(storage.getItem<Theme>(STORAGE_KEYS.theme) ?? getSystemTheme());
};
