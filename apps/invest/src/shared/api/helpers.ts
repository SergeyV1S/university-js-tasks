import type { MarketError } from "./type.ts";

const marketError = (
  kind: MarketError["kind"],
  details?: Pick<MarketError, "status" | "retryAt">,
): MarketError => Object.assign(new Error(`CoinGecko: ${kind}`), { kind, ...details });

const parseRetryAfter = (header: unknown) => {
  if (typeof header !== "string") return undefined;
  const value = header.trim();
  const retryAt = /^\d+$/.test(value)
    ? Date.now() + Number(value) * 1_000
    : /[a-z]{3}/i.test(value) ? Date.parse(value) : NaN;
  return Number.isFinite(retryAt) ? retryAt : undefined;
};

export { parseRetryAfter, marketError }