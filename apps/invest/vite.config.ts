import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode, isPreview }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  define: {
    __INVEST_DEV_MARKET_DEMO_KEY__: JSON.stringify(
      command === "serve" && !isPreview
        ? (loadEnv(mode, process.cwd(), "INVEST_").INVEST_MARKET_DEMO_KEY ?? "")
        : ""
    )
  }
}));
