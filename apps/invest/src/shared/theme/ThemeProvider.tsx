import { useLayoutEffect } from "react";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  useLayoutEffect(() => {
    try {
      if (localStorage.getItem("invest:theme") === "light") {
        document.documentElement.dataset.theme = "light";

        const meta = document.querySelector('meta[nmae="theme-color"]') as HTMLMetaElement;
        meta.content = "#f3f0ea";
      }
    } catch {}
  }, []);

  return children;
};
