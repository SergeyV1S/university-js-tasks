import { create } from "zustand";

import type { HistoryDays } from "../../shared/api/type";
import { initialPeriod, loadHistory } from "./api";
import type { CoinHistory, CoinInitialData } from "./api";
import type { ConverterCurrency } from "./helpers/converter";

type CoinState = {
  initial: CoinInitialData | null;
  history: CoinHistory | null;
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
  let historyRequest: AbortController | undefined;

  const stop = () => {
    historyRequest?.abort();
    historyRequest = undefined;
  };

  return {
    initial: null,
    history: null,
    period: initialPeriod,
    quantity: "1",
    currency: "USD",
    setInitialData: (data) => {
      stop();
      set({
        initial: data,
        history: data.status === "ready" ? data.history : null,
        period: initialPeriod,
        quantity: "1",
        currency: "USD",
      });
    },
    setPeriod: async (period) => {
      const { initial, period: current } = get();
      if (initial?.status !== "ready" || period === current) return;

      stop();
      const controller = new AbortController();
      historyRequest = controller;
      set({ period, history: null });

      try {
        const history = await loadHistory(initial.coin.id, period, controller.signal);
        if (historyRequest === controller) set({ history });
      } catch (error) {
        if (!controller.signal.aborted) throw error;
      } finally {
        if (historyRequest === controller) historyRequest = undefined;
      }
    },
    setQuantity: (quantity) => set({ quantity }),
    setCurrency: (currency) => set({ currency }),
    stop,
  };
});
