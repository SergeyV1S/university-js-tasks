import { MARKET_ERROR_KIND } from "./type.ts";
import type { MarketError } from "./type.ts";

const marketError = (
  kind: MarketError["kind"],
  details?: Pick<MarketError, "status" | "retryAt">
): MarketError => Object.assign(new Error(`CoinGecko: ${kind}`), { kind, ...details });

const parseRetryAfter = (header: unknown) => {
  if (typeof header !== "string") return undefined;
  const value = header.trim();
  let retryAt = Number.NaN;
  if (/^\d+$/.test(value)) retryAt = Date.now() + Number(value) * 1_000;
  else if (/[a-z]{3}/i.test(value)) retryAt = Date.parse(value);
  return Number.isFinite(retryAt) ? retryAt : undefined;
};

const marketErrorKinds = Object.values(MARKET_ERROR_KIND);
const isMarketError = (error: unknown): error is MarketError =>
  error instanceof Error &&
  "kind" in error &&
  marketErrorKinds.some((kind) => kind === error.kind) &&
  (!("status" in error) || error.status === undefined || typeof error.status === "number") &&
  (!("retryAt" in error) || error.retryAt === undefined || typeof error.retryAt === "number");

export { parseRetryAfter, marketError, isMarketError };
