import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4174";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  use: { baseURL },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
    { name: "firefox", use: { browserName: "firefox" } }
  ],
  webServer: {
    command: "vite --host 127.0.0.1 --port 4174 --strictPort",
    url: baseURL,
    env: { VITE_INVEST_MARKET_BASE: "/api/v3/" }
  }
});
