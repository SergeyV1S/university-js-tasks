import { useState } from "react";
import { STORAGE_KEYS, type Theme } from "@/shared/constants";
import { usePageLeave } from "@/shared/hooks";
import { storage } from "@/shared/utils";
import { getSystemTheme } from "../helpers/theme";

export const useThemeState = () => {
  const [theme, setTheme] = useState<Theme>(
    () => storage.getItem<Theme>(STORAGE_KEYS.theme) ?? getSystemTheme()
  );

  usePageLeave(() => {
    storage.setItem(STORAGE_KEYS.theme, theme);
  });

  return {
    state: { theme },
    functions: { setTheme }
  };
};
