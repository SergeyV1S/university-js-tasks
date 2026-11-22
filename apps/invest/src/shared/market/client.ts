export type Currency = "USD" | "EUR" | "BTC" | "RUB";
type HistoryDays = 1 | 7 | 30 | 365;
type RequestOptions = { signal: AbortSignal };
type CatalogCoin = { id: string; name: string };
type Quotes = Partial<Record<Currency, number>>;

export type Coin = CatalogCoin & {
  rank: number | null;
  price: number | null;
  change24h: number | null;
  marketCap: number | null;
};

type GlobalMetrics = {
  marketCap: number | null;
  marketCapChange24h: number | null;
  volume24h: number | null;
};

export type MarketError = Error & {
  kind: "rate-limit" | "network" | "not-found" | "http" | "invalid-response";
  status?: number;
  retryAt?: number;
};

export type MarketClient = {
  getCatalog: (options?: RequestOptions) => Promise<CatalogCoin[]>;
  getTop100: (options?: RequestOptions) => Promise<Coin[]>;
  getMarkets: (ids: string[], options?: RequestOptions) => Promise<Coin[]>;
  getGlobal: (options?: RequestOptions) => Promise<GlobalMetrics>;
  getHistory: (id: string, days: HistoryDays, options?: RequestOptions) => Promise<Array<[number, number]>>;
  getPrices: (ids: string[], currencies: Currency[], options?: RequestOptions) => Promise<Record<string, Quotes>>;
  getExchangeRates: (options?: RequestOptions) => Promise<Quotes>;
};

type ClientOptions = {
  baseUrl: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

declare const __INVEST_DEV_MARKET_DEMO_KEY__: string;

const DEMO_API_BASE = "https://api.coingecko.com/api/v3/";
const CURRENCIES: readonly Currency[] = ["USD", "EUR", "BTC", "RUB"];
const MARKETS_PAGE_SIZE = 250;
const SIMPLE_PRICE_MAX_IDS = 515;
// Budget for the encoded URL, including the base and all query parameters.
const REQUEST_URL_BUDGET = 2_000;
const USD_MARKETS = { vs_currency: "usd", order: "market_cap_desc", page: "1" };

const marketError = (kind: MarketError["kind"], details?: Pick<MarketError, "status" | "retryAt">): MarketError =>
  Object.assign(new Error(`CoinGecko: ${kind}`), { kind, ...details });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readObject = (value: unknown) => {
  if (!isRecord(value)) throw marketError("invalid-response");
  return value;
};

const readArray = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw marketError("invalid-response");
  return value;
};

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const numberOrNull = (value: unknown) => isNumber(value) ? value : null;

const readCoinIdentity = ({ id, name }: Record<string, unknown>): CatalogCoin => {
  if (typeof id !== "string" || id.length === 0 || typeof name !== "string" || name.length === 0) {
    throw marketError("invalid-response");
  }
  return { id, name };
};

const readCoins = (value: unknown): Coin[] => readArray(value).map((item) => {
  const coin = readObject(item);
  return {
    ...readCoinIdentity(coin),
    rank: numberOrNull(coin.market_cap_rank),
    price: numberOrNull(coin.current_price),
    change24h: numberOrNull(coin.price_change_percentage_24h),
    marketCap: numberOrNull(coin.market_cap),
  };
});

const readQuotes = (
  currencies: readonly Currency[],
  readValue: (code: string) => unknown,
): Quotes => {
  const quotes: Quotes = {};
  for (const currency of currencies) {
    const value = readValue(currency.toLowerCase());
    if (isNumber(value)) quotes[currency] = value;
  }
  return quotes;
};

const parseRetryAfter = (header: string | null) => {
  if (!header) return undefined;
  const value = header.trim();
  const retryAt = /^\d+$/.test(value)
    ? Date.now() + Number(value) * 1_000
    : /[a-z]{3}/i.test(value) ? Date.parse(value) : NaN;
  return Number.isFinite(retryAt) ? retryAt : undefined;
};

const rethrowAbort = (error: unknown, signal?: AbortSignal) => {
  if (error instanceof Error && error.name === "AbortError") throw error;
  signal?.throwIfAborted();
};

const batchByUrl = (
  ids: string[],
  maxIds: number,
  buildUrl: (ids: string[]) => URL,
) => {
  const batches: Array<{ ids: string[]; url: URL }> = [];
  let batch: string[] = [];
  let url = buildUrl(batch);

  for (const id of new Set(ids)) {
    const nextBatch = [...batch, id];
    const nextUrl = buildUrl(nextBatch);
    if (nextBatch.length <= maxIds && nextUrl.href.length <= REQUEST_URL_BUDGET) {
      batch = nextBatch;
      url = nextUrl;
      continue;
    }

    if (batch.length > 0) batches.push({ ids: batch, url });
    batch = [id];
    url = buildUrl(batch);
    if (url.href.length > REQUEST_URL_BUDGET) {
      throw new RangeError("Coin ID exceeds the CoinGecko request URL budget");
    }
  }

  if (batch.length > 0) batches.push({ ids: batch, url });
  return batches;
};

export const createMarketClient = (config: ClientOptions): MarketClient => {
  const { baseUrl, fetchImpl = fetch } = config;
  const base = new URL(baseUrl, globalThis.location?.href);
  if (!base.pathname.endsWith("/")) base.pathname += "/";

  const buildUrl = (path: string, query?: Record<string, string>) => {
    const url = new URL(path, base);
    url.search = new URLSearchParams(query).toString();
    return url;
  };

  const request = async (url: URL, options?: RequestOptions): Promise<unknown> => {
    const signal = options?.signal;
    signal?.throwIfAborted();
    const apiKey = config.apiKey;
    let response: Response;

    try {
      response = await fetchImpl(url, {
        signal,
        headers: apiKey ? { "x-cg-demo-api-key": apiKey } : undefined,
      });
    } catch (error) {
      rethrowAbort(error, signal);
      throw marketError("network");
    }

    signal?.throwIfAborted();
    const { status } = response;
    if (status === 429) {
      const retryAt = parseRetryAfter(response.headers.get("Retry-After"));
      throw marketError("rate-limit", retryAt === undefined ? { status } : { status, retryAt });
    }
    if (status === 404) throw marketError("not-found", { status });
    if (!response.ok) throw marketError("http", { status });

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      rethrowAbort(error, signal);
      throw marketError(error instanceof SyntaxError ? "invalid-response" : "network");
    }
    signal?.throwIfAborted();
    return data;
  };

  return {
    getCatalog: async (options) => {
      const payload = await request(buildUrl("coins/list", { include_platform: "false" }), options);
      return readArray(payload).map((coin) => readCoinIdentity(readObject(coin)));
    },
    getTop100: async (options) => readCoins(await request(
      buildUrl("coins/markets", { ...USD_MARKETS, per_page: "100" }), options,
    )),
    getMarkets: async (ids, options) => {
      const batches = batchByUrl(ids, MARKETS_PAGE_SIZE, (batch) => buildUrl("coins/markets", {
        ...USD_MARKETS,
        per_page: String(batch.length),
        ids: batch.join(","),
      }));
      const coins: Coin[] = [];
      for (const { url } of batches) {
        coins.push(...readCoins(await request(url, options)));
      }
      return coins;
    },
    getGlobal: async (options) => {
      const payload = readObject(await request(buildUrl("global"), options));
      const data = readObject(payload.data);
      return {
        marketCap: numberOrNull(isRecord(data.total_market_cap) ? data.total_market_cap.usd : undefined),
        marketCapChange24h: numberOrNull(data.market_cap_change_percentage_24h_usd),
        volume24h: numberOrNull(isRecord(data.total_volume) ? data.total_volume.usd : undefined),
      };
    },
    getHistory: async (id, days, options) => {
      if (id === "" || id === "." || id === "..") throw marketError("not-found");
      const payload = readObject(await request(buildUrl(`coins/${encodeURIComponent(id)}/market_chart`, {
        vs_currency: "usd",
        days: String(days),
      }), options));
      return readArray(payload.prices).map((sample) => {
        const [timestamp, price] = readArray(sample);
        if (!isNumber(timestamp) || !isNumber(price)) throw marketError("invalid-response");
        return [timestamp, price];
      });
    },
    getPrices: async (ids, currencies, options) => {
      const requestedCurrencies = [...new Set(currencies)];
      if (requestedCurrencies.length === 0) return {};

      const batches = batchByUrl(ids, SIMPLE_PRICE_MAX_IDS, (batch) => buildUrl("simple/price", {
        ids: batch.join(","),
        vs_currencies: requestedCurrencies.map((currency) => currency.toLowerCase()).join(","),
      }));
      const prices: Array<[string, Quotes]> = [];
      for (const { ids: batch, url } of batches) {
        const payload = readObject(await request(url, options));
        for (const id of batch) {
          const values = payload[id];
          if (Object.hasOwn(payload, id) && isRecord(values)) {
            prices.push([id, readQuotes(requestedCurrencies, (code) => values[code])]);
          }
        }
      }
      return Object.fromEntries(prices);
    },
    getExchangeRates: async (options) => {
      const payload = readObject(await request(buildUrl("exchange_rates"), options));
      const rates = readObject(payload.rates);
      return readQuotes(CURRENCIES, (code) => {
        const rate = rates[code];
        return isRecord(rate) ? rate.value : undefined;
      });
    },
  };
};

const marketBase = import.meta.env?.VITE_INVEST_MARKET_BASE ?? DEMO_API_BASE;

export const marketClient = createMarketClient({
  baseUrl: marketBase,
  get apiKey() {
    if (marketBase === DEMO_API_BASE
      && typeof __INVEST_DEV_MARKET_DEMO_KEY__ !== "undefined"
      && __INVEST_DEV_MARKET_DEMO_KEY__) {
      return __INVEST_DEV_MARKET_DEMO_KEY__;
    }
    try {
      return globalThis.sessionStorage?.getItem("invest:market-demo-key") ?? undefined;
    } catch {
      return undefined;
    }
  },
});
