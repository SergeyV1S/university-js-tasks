import { marketError } from "./helpers";
import { createMarketInstance } from "./instance";
import { createMarketRequests } from "./requests";
import type { MarketInstanceOptions, RequestOptions } from "./type";


export type Currency = "USD" | "EUR" | "BTC" | "RUB";
type HistoryDays = 1 | 7 | 30 | 365;
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

export type MarketClient = {
  getCatalog: (options?: RequestOptions) => Promise<CatalogCoin[]>;
  getTop100: (options?: RequestOptions) => Promise<Coin[]>;
  getMarkets: (ids: string[], options?: RequestOptions) => Promise<Coin[]>;
  getGlobal: (options?: RequestOptions) => Promise<GlobalMetrics>;
  getHistory: (id: string, days: HistoryDays, options?: RequestOptions) => Promise<Array<[number, number]>>;
  getPrices: (ids: string[], currencies: Currency[], options?: RequestOptions) => Promise<Record<string, Quotes>>;
  getExchangeRates: (options?: RequestOptions) => Promise<Quotes>;
};

declare const __INVEST_DEV_MARKET_DEMO_KEY__: string;

const DEMO_API_BASE = "https://api.coingecko.com/api/v3/";
const CURRENCIES: readonly Currency[] = ["USD", "EUR", "BTC", "RUB"];
const MARKETS_PAGE_SIZE = 250;
const SIMPLE_PRICE_MAX_IDS = 515;
// Budget for the encoded URL, including the base and all query parameters.
const REQUEST_URL_BUDGET = 2_000;
const USD_MARKETS = { vs_currency: "usd", order: "market_cap_desc", page: 1 } as const;

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

const batchByUrl = <Params>(
  ids: string[],
  maxIds: number,
  buildParams: (ids: string[]) => Params,
  getUri: (params: Params) => string,
) => {
  const batches: Array<{ ids: string[]; params: Params }> = [];
  let batch: string[] = [];

  for (const id of new Set(ids)) {
    const nextBatch = [...batch, id];
    if (nextBatch.length <= maxIds && getUri(buildParams(nextBatch)).length <= REQUEST_URL_BUDGET) {
      batch = nextBatch;
      continue;
    }

    if (batch.length > 0) batches.push({ ids: batch, params: buildParams(batch) });
    batch = [id];
    if (getUri(buildParams(batch)).length > REQUEST_URL_BUDGET) {
      throw new RangeError("Coin ID exceeds the CoinGecko request URL budget");
    }
  }

  if (batch.length > 0) batches.push({ ids: batch, params: buildParams(batch) });
  return batches;
};

export const createMarketClient = (config: MarketInstanceOptions): MarketClient => {
  const requests = createMarketRequests(createMarketInstance(config));

  return {
    getCatalog: async (options) => {
      const payload = await requests.getCoinsList(options);
      return readArray(payload).map((coin) => readCoinIdentity(readObject(coin)));
    },
    getTop100: async (options) => readCoins(await requests.getCoinsMarkets(
      { ...USD_MARKETS, per_page: 100 }, options,
    )),
    getMarkets: async (ids, options) => {
      const batches = batchByUrl(ids, MARKETS_PAGE_SIZE, (batch) => ({
        ...USD_MARKETS,
        per_page: batch.length,
        ids: batch.join(","),
      }), requests.getCoinsMarketsUri);
      const coins: Coin[] = [];
      for (const { params } of batches) {
        coins.push(...readCoins(await requests.getCoinsMarkets(params, options)));
      }
      return coins;
    },
    getGlobal: async (options) => {
      const payload = readObject(await requests.getGlobalMarketData(options));
      const data = readObject(payload.data);
      return {
        marketCap: numberOrNull(isRecord(data.total_market_cap) ? data.total_market_cap.usd : undefined),
        marketCapChange24h: numberOrNull(data.market_cap_change_percentage_24h_usd),
        volume24h: numberOrNull(isRecord(data.total_volume) ? data.total_volume.usd : undefined),
      };
    },
    getHistory: async (id, days, options) => {
      if (id === "" || id === "." || id === "..") throw marketError("not-found");
      const payload = readObject(await requests.getCoinMarketChart(id, days, options));
      return readArray(payload.prices).map((sample) => {
        const [timestamp, price] = readArray(sample);
        if (!isNumber(timestamp) || !isNumber(price)) throw marketError("invalid-response");
        return [timestamp, price];
      });
    },
    getPrices: async (ids, currencies, options) => {
      const requestedCurrencies = [...new Set(currencies)];
      if (requestedCurrencies.length === 0) return {};

      const vsCurrencies = requestedCurrencies.map((currency) => currency.toLowerCase()).join(",");
      const batches = batchByUrl(ids, SIMPLE_PRICE_MAX_IDS, (batch) => ({
        ids: batch.join(","),
        vs_currencies: vsCurrencies,
      }), requests.getSimplePriceUri);
      const prices: Array<[string, Quotes]> = [];
      for (const { ids: batch, params } of batches) {
        const payload = readObject(await requests.getSimplePrice(params, options));
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
      const payload = readObject(await requests.getExchangeRates(options));
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
