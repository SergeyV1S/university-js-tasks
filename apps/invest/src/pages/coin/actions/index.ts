import {
  getCoinsIdMarketChart,
  getCoinsIdOhlc,
  getCoinsList,
  getCoinsMarkets,
  getExchangeRates,
  getSimplePrice
} from "@/shared/api/requests";
import { readMarket } from "@/shared/market";
import type { HistoryDays, Quotes } from "@/shared/api/requests";

import { converterCurrencies, isQuote } from "../helpers";

export const initialPeriod = 7 satisfies HistoryDays;

export const loadHistory = async (id: string, period: HistoryDays, signal: AbortSignal) => {
  if (period === 1) {
    const candles = await getCoinsIdOhlc({ params: { id }, config: { signal } });
    return {
      period,
      candles: [...candles].sort((left, right) => left.timestamp - right.timestamp)
    } as const;
  }

  const prices = await getCoinsIdMarketChart({ params: { id, days: period }, config: { signal } });
  return { period, prices: [...prices].sort(([left], [right]) => left - right) } as const;
};

export type HistorySeries = Awaited<ReturnType<typeof loadHistory>>;

export const loadCoinMarkets = async (id: string, signal: AbortSignal) => {
  const markets = await getCoinsMarkets({ params: { ids: [id] }, config: { signal } });
  return markets.find((coin) => coin.id === id) ?? null;
};

export const loadConverterQuotes = async (id: string, signal: AbortSignal) => {
  const prices = await getSimplePrice({
    params: { ids: [id], currencies: converterCurrencies },
    config: { signal }
  });
  return Object.hasOwn(prices, id) ? prices[id] : {};
};

export const needsConverterRates = (quotes: Quotes) =>
  isQuote(quotes.USD) && converterCurrencies.some((currency) => !isQuote(quotes[currency]));

export const loadConverterRates = (signal: AbortSignal) => getExchangeRates({ config: { signal } });

const loadConverter = async (id: string, signal: AbortSignal) => {
  const quotes = await readMarket(signal, () => loadConverterQuotes(id, signal));
  const rates =
    quotes.data && needsConverterRates(quotes.data)
      ? await readMarket(signal, () => loadConverterRates(signal))
      : undefined;
  return { quotes, rates };
};

export const loadCoinData = async (id: string, signal: AbortSignal) => {
  if (id === "" || id === "." || id === "..") return { status: "not-found" } as const;

  const catalog = await getCoinsList({ config: { signal } });
  const identity = catalog.find((coin) => coin.id === id);
  if (!identity) return { status: "not-found" } as const;

  const [history, converter, market] = await Promise.all([
    readMarket(signal, () => loadHistory(id, initialPeriod, signal)),
    loadConverter(id, signal),
    readMarket(signal, () => loadCoinMarkets(id, signal))
  ]);
  return { status: "ready", identity, history, converter, market } as const;
};

export const loadCoin = async (id: string, signal: AbortSignal) => ({
  id,
  result: await readMarket(signal, () => loadCoinData(id, signal))
});

export type CoinInitialData = Awaited<ReturnType<typeof loadCoin>>;
export type CoinData = Awaited<ReturnType<typeof loadCoinData>>;
