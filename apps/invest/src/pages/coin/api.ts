import { apiClient } from "@/shared/api/client";
import type { HistoryDays } from "@/shared/api/type";

import { converterCurrencies, isQuote } from "./helpers/converter";

export const initialPeriod = 7 satisfies HistoryDays;

export const loadHistory = async (id: string, days: HistoryDays, signal: AbortSignal) => {
  const prices = await apiClient.getHistory(id, days, { signal }).catch(() => null);
  signal.throwIfAborted();
  if (prices === null) return { status: "error" } as const;
  prices.sort(([left], [right]) => left - right);
  return { status: "ready", prices } as const;
};

const loadConverter = async (id: string, signal: AbortSignal) => {
  const quotesByCoin = await apiClient
    .getPrices([id], [...converterCurrencies], { signal })
    .catch(() => null);
  signal.throwIfAborted();
  if (quotesByCoin === null) return { quotes: null, rates: {} };

  const quotes = Object.hasOwn(quotesByCoin, id) ? quotesByCoin[id] : {};
  const needsRates =
    isQuote(quotes.USD) && converterCurrencies.some((currency) => !isQuote(quotes[currency]));
  const rates = needsRates ? await apiClient.getExchangeRates({ signal }).catch(() => null) : {};
  signal.throwIfAborted();
  return { quotes, rates };
};

export const loadCoin = async (id: string, signal: AbortSignal) => {
  const catalog = await apiClient.getCatalog({ signal }).catch(() => null);
  signal.throwIfAborted();
  if (catalog === null) return { status: "error" } as const;

  const identity = catalog.find((coin) => coin.id === id);
  if (!identity) return { status: "not-found" } as const;

  const [history, converter, markets] = await Promise.all([
    loadHistory(id, initialPeriod, signal),
    loadConverter(id, signal),
    apiClient.getMarkets([id], { signal }).catch(() => null)
  ]);
  signal.throwIfAborted();

  const market = markets?.find((coin) => coin.id === id);
  const coin = {
    image: market?.image,
    rank: market?.rank ?? null,
    price: market?.price ?? converter.quotes?.USD ?? null,
    change24h: market?.change24h ?? null,
    marketCap: market?.marketCap ?? null,
    ...identity,
    symbol: identity.symbol ?? market?.symbol
  };

  return { status: "ready", coin, history, converter, marketError: markets === null } as const;
};

export type CoinInitialData = Awaited<ReturnType<typeof loadCoin>>;
export type CoinHistory = Awaited<ReturnType<typeof loadHistory>>;
export type ConverterData = Awaited<ReturnType<typeof loadConverter>>;
