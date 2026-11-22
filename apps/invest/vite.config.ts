import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode, isPreview }) => ({
  plugins: [react(), tailwindcss()],
  define: {
    __INVEST_DEV_MARKET_DEMO_KEY__: JSON.stringify(
      command === "serve" && !isPreview
        ? (loadEnv(mode, process.cwd(), "INVEST_").INVEST_MARKET_DEMO_KEY ?? "")
        : ""
    )
  }
}));
