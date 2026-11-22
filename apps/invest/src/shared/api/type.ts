import type { AxiosAdapter } from "axios";

export type RequestOptions = { signal: AbortSignal };

export type MarketInstanceOptions = {
  baseUrl: string;
  apiKey?: string;
  adapter?: AxiosAdapter;
};

export type MarketError = Error & {
  kind: "rate-limit" | "network" | "not-found" | "http" | "invalid-response";
  status?: number;
  retryAt?: number;
};