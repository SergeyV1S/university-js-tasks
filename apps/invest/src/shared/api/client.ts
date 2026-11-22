import { marketError } from "./helpers.ts";
import { createMarketInstance } from "./instance.ts";
import { createMarketRequests } from "./requests.ts";
import type { CatalogCoin, Coin, Currency, MarketClient, MarketInstanceOptions, Quotes } from "./type.ts";

declare const __INVEST_DEV_MARKET_DEMO_KEY__: string;

const CURRENCIES: readonly Currency[] = ["USD", "EUR", "BTC", "RUB"];
const MARKETS_PAGE_SIZE = 250;
const SIMPLE_PRICE_MAX_IDS = 515;
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

const readCoinIdentity = ({ id, name, symbol }: Record<string, unknown>): CatalogCoin => {
  if (typeof id !== "string" || id.length === 0 || typeof name !== "string" || name.length === 0) {
    throw marketError("invalid-response");
  }
  return typeof symbol === "string" && symbol ? { id, name, symbol } : { id, name };
};

const readCoins = (value: unknown): Coin[] => readArray(value).map((item) => {
  const coin = readObject(item);
  return {
    ...readCoinIdentity(coin),
    ...(typeof coin.image === "string" && coin.image.startsWith("https://") && { image: coin.image }),
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

export const createApiClient = (config: MarketInstanceOptions): MarketClient => {
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
      const shares = isRecord(data.market_cap_percentage) ? data.market_cap_percentage : {};
      return {
        marketCap: numberOrNull(isRecord(data.total_market_cap) ? data.total_market_cap.usd : undefined),
        marketCapChange24h: numberOrNull(data.market_cap_change_percentage_24h_usd),
        volume24h: numberOrNull(isRecord(data.total_volume) ? data.total_volume.usd : undefined),
        bitcoinShare: numberOrNull(shares.btc),
        ethereumShare: numberOrNull(shares.eth),
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

const baseUrl = import.meta.env?.VITE_INVEST_MARKET_BASE || "https://api.coingecko.com/api/v3/";

export const apiClient = createApiClient({
  baseUrl,
  get apiKey() {
    if (typeof __INVEST_DEV_MARKET_DEMO_KEY__ !== "undefined"
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
