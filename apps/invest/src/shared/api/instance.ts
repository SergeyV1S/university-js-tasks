import axios from "axios";

import {
  createMarketCooldown,
  isMarketError,
  marketError,
  parseRetryAfter
} from "../market/index.ts";

declare const __INVEST_DEV_MARKET_DEMO_KEY__: string;

const baseUrl = import.meta.env?.VITE_INVEST_MARKET_BASE || "https://api.coingecko.com/api/v3/";
const cooldown = typeof window === "undefined" ? undefined : createMarketCooldown();

const readDemoKey = () => {
  if (typeof __INVEST_DEV_MARKET_DEMO_KEY__ !== "undefined" && __INVEST_DEV_MARKET_DEMO_KEY__) {
    return __INVEST_DEV_MARKET_DEMO_KEY__;
  }
  try {
    return globalThis.sessionStorage?.getItem("invest:market-demo-key");
  } catch {
    return undefined;
  }
};

export const marketApi = axios.create({
  baseURL: new URL(baseUrl, globalThis.location?.href).href
});

marketApi.interceptors.request.use((config) => {
  // Axios handles an already aborted signal before calling the adapter.
  if (config.signal?.aborted) return config;
  cooldown?.check();

  const apiKey = readDemoKey();
  if (apiKey) config.headers.set("x-cg-demo-api-key", apiKey);
  return config;
});

marketApi.interceptors.response.use(
  (response) => {
    const signal = response.config.signal;
    if (signal instanceof AbortSignal) signal.throwIfAborted();
    return response;
  },
  (error: unknown) => {
    if (axios.isCancel(error)) {
      const signal = error.config?.signal;
      if (signal instanceof AbortSignal) signal.throwIfAborted();
      throw new DOMException(error.message, "AbortError");
    }
    if (isMarketError(error) || (error instanceof Error && error.name === "AbortError"))
      throw error;

    const response = axios.isAxiosError(error) ? error.response : undefined;
    if (!response) throw marketError("network");

    const { status } = response;
    if (status === 429) {
      const retryAt = parseRetryAfter(response.headers["retry-after"]);
      cooldown?.record(retryAt);
      throw marketError("rate-limit", retryAt === undefined ? { status } : { status, retryAt });
    }
    if (status === 404) throw marketError("not-found", { status });
    throw marketError("http", { status });
  }
);
