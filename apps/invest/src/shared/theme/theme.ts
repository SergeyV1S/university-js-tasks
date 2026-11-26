import { useSyncExternalStore } from "react";

const getTheme = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

const subscribe = (onChange: () => void) => {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
};

export const useTheme = () => useSyncExternalStore(subscribe, getTheme);

export const toggleTheme = () => {
  const theme = getTheme() === "light" ? "dark" : "light";
  const root = document.documentElement;
  root.dataset.theme = theme;
  const themeColor = getComputedStyle(root).getPropertyValue("--color-invest-background").trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", themeColor);

  try {
    localStorage.setItem("invest:theme", theme);
  } catch {}
};
