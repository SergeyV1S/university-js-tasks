import { create } from "zustand";

import { createMarketResource } from "@/shared/market";
import type { Coin, HistoryDays, Quotes } from "@/shared/api/requests";
import type { MarketResult, MarketState } from "@/shared/market";

import {
  initialPeriod,
  loadCoinData,
  loadCoinMarkets,
  loadConverterQuotes,
  loadConverterRates,
  loadHistory,
  needsConverterRates
} from "../actions";
import type { CoinData, CoinInitialData, HistorySeries } from "../actions";
import type { ConverterCurrency } from "../helpers";

type CoinState = {
  initial: CoinInitialData | null;
  details: MarketState<CoinData> | null;
  market: MarketState<Coin | null> | null;
  history: MarketState<HistorySeries> | null;
  quotes: MarketState<Quotes> | null;
  rates: MarketState<Quotes> | null;
  period: HistoryDays;
  quantity: string;
  currency: ConverterCurrency;
  setInitialData: (data: CoinInitialData) => void;
  setPeriod: (period: HistoryDays) => Promise<void>;
  setQuantity: (raw: string) => void;
  setCurrency: (currency: ConverterCurrency) => void;
  stop: () => void;
};

export const useCoinStore = create<CoinState>()((set, get) => {
  let details: ReturnType<typeof createMarketResource<CoinData>> | undefined;
  let market: ReturnType<typeof createMarketResource<Coin | null>> | undefined;
  let history: ReturnType<typeof createMarketResource<HistorySeries>> | undefined;
  let quotes: ReturnType<typeof createMarketResource<Quotes>> | undefined;
  let rates: ReturnType<typeof createMarketResource<Quotes>> | undefined;
  const lastQuotes = new Map<string, Quotes>();
  let lastRates: Quotes | null = null;

  const createHistory = (id: string, period: HistoryDays, initial?: MarketResult<HistorySeries>) =>
    createMarketResource({
      initial,
      retainOnFailure: false,
      load: (signal) => loadHistory(id, period, signal),
      onState: (history) => set({ history })
    });

  const createRates = (initial?: MarketResult<Quotes>) =>
    createMarketResource({
      initial,
      previous: lastRates,
      retainOnFailure: true,
      load: loadConverterRates,
      onState: (rates) => {
        if (rates.status === "ready") lastRates = rates.data;
        set({ rates });
      }
    });

  const attachDetails = (data: Extract<CoinData, { status: "ready" }>) => {
    const id = data.identity.id;
    history = createHistory(id, initialPeriod, data.history);
    market = createMarketResource({
      initial: data.market,
      retainOnFailure: true,
      load: (signal) => loadCoinMarkets(id, signal),
      onState: (market) => set({ market })
    });
    if (data.converter.rates) rates = createRates(data.converter.rates);
    quotes = createMarketResource({
      initial: data.converter.quotes,
      previous: lastQuotes.get(id),
      retainOnFailure: true,
      load: (signal) => loadConverterQuotes(id, signal),
      onState: (quotes) => {
        set({ quotes });
        if (quotes.status === "ready" && quotes.data) lastQuotes.set(id, quotes.data);
        if (!quotes.data || !needsConverterRates(quotes.data)) return;
        if (!rates) {
          rates = createRates(
            lastRates && quotes.error ? { data: lastRates, error: null } : undefined
          );
          if (!lastRates || !quotes.error) void rates.run();
        }
      }
    });
  };

  const stop = () => {
    details?.stop();
    market?.stop();
    history?.stop();
    quotes?.stop();
    rates?.stop();
    rates = undefined;
  };

  return {
    initial: null,
    details: null,
    market: null,
    history: null,
    quotes: null,
    rates: null,
    period: initialPeriod,
    quantity: "1",
    currency: "USD",
    setInitialData: (data) => {
      stop();
      set({
        initial: data,
        details: null,
        market: null,
        history: null,
        quotes: null,
        rates: null,
        period: initialPeriod,
        quantity: "1",
        currency: "USD"
      });
      details = createMarketResource({
        initial: data.result,
        retainOnFailure: false,
        load: (signal) => loadCoinData(data.id, signal),
        onState: (details) => {
          if (details.status === "ready" && details.data?.status === "ready") {
            attachDetails(details.data);
          }
          set({ details });
        }
      });
    },
    setPeriod: async (period) => {
      const { details, period: current } = get();
      if (details?.data?.status !== "ready" || period === current) return;

      history?.stop();
      set({ period, history: null });
      history = createHistory(details.data.identity.id, period);
      await history.run();
    },
    setQuantity: (quantity) => set({ quantity }),
    setCurrency: (currency) => set({ currency }),
    stop
  };
});
