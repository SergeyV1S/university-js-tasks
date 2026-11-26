export const MARKET_ERROR_KIND = {
  rateLimit: "rate-limit",
  network: "network",
  notFound: "not-found",
  http: "http",
  invalidResponse: "invalid-response"
} as const;

export type MarketError = Error & {
  kind: (typeof MARKET_ERROR_KIND)[keyof typeof MARKET_ERROR_KIND];
  status?: number;
  retryAt?: number;
};
