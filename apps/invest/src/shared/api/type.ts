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

export type Currency = "USD" | "EUR" | "BTC" | "RUB";
export type HistoryDays = 1 | 7 | 30 | 365;
export type CatalogCoin = { id: string; name: string; symbol?: string };
export type Quotes = Partial<Record<Currency, number>>;

export type Coin = CatalogCoin & {
  image?: string;
  rank: number | null;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
};

export type GlobalMetrics = {
  marketCap: number | null;
  marketCapChange24h: number | null;
  volume24h: number | null;
  bitcoinShare: number | null;
  ethereumShare: number | null;
};

export type MarketClient = {
  getCatalog: (options?: RequestOptions) => Promise<CatalogCoin[]>;
  getTop100: (options?: RequestOptions) => Promise<Coin[]>;
  getMarkets: (ids: string[], options?: RequestOptions) => Promise<Coin[]>;
  getGlobal: (options?: RequestOptions) => Promise<GlobalMetrics>;
  getHistory: (
    id: string,
    days: HistoryDays,
    options?: RequestOptions
  ) => Promise<Array<[number, number]>>;
  getPrices: (
    ids: string[],
    currencies: Currency[],
    options?: RequestOptions
  ) => Promise<Record<string, Quotes>>;
  getExchangeRates: (options?: RequestOptions) => Promise<Quotes>;
};
