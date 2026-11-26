import { RouterProvider } from "react-router/dom";

import { router } from "./router";
import { ThemeProvider } from "@/shared/theme";

export const Providers = () => (
  <ThemeProvider>
    <RouterProvider router={router} />
  </ThemeProvider>
);
