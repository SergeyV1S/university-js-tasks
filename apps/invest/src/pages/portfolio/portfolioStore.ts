import { create } from "zustand";

import { apiClient } from "@/shared/api/client";
import { isPositiveNumber, parsePositiveDecimal } from "@/shared/helpers/positiveNumber";

import {
  loadPortfolioCatalog,
  loadPortfolioCoins,
  loadPortfolioPrices,
  needsCatalog,
  portfolioCoinIds
} from "./api";
import { appendPurchase, canWritePortfolio, readPortfolio, subscribePortfolio } from "./storage";
import type {
  PortfolioCurrency,
  PortfolioInitialData,
  PortfolioSnapshot,
  PurchaseDraft,
  PurchaseErrors
} from "./types";

type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "rate-error" | "write-error";
type SubmitResult = "saved" | "rejected" | "ignored";

type PortfolioState = {
  initial: PortfolioInitialData | null;
  snapshot: PortfolioSnapshot | null;
  readFailed: boolean;
  coins: PortfolioInitialData["coins"];
  catalog: PortfolioInitialData["catalog"];
  prices: PortfolioInitialData["prices"];
  loadingCoins: boolean;
  loadingQuotes: boolean;
  currency: PortfolioCurrency;
  writable: boolean;
  saveStatus: SaveStatus;
  errors: PurchaseErrors;
  setInitialData: (data: PortfolioInitialData) => void;
  retryRead: () => Promise<void>;
  retryCoins: () => Promise<void>;
  loadQuotes: () => Promise<void>;
  close: () => void;
  setCurrency: (currency: PortfolioCurrency) => void;
  clearFieldError: (field: keyof PurchaseDraft) => void;
  dismissSuccess: () => void;
  submit: (draft: PurchaseDraft) => Promise<SubmitResult>;
};

const readRubPerUsd = async (signal: AbortSignal) => {
  try {
    const { RUB, USD } = await apiClient.getExchangeRates({ signal });
    if (!isPositiveNumber(RUB) || !isPositiveNumber(USD)) return null;
    const rate = RUB / USD;
    return isPositiveNumber(rate) ? rate : null;
  } catch {
    return null;
  }
};

export const usePortfolioStore = create<PortfolioState>((set, get) => {
  let unsubscribe: (() => void) | undefined;
  let lifecycle: AbortController | undefined;
  let quoteRequest: AbortController | undefined;
  let loadingCatalog = false;

  const loadQuotes = async () => {
    if (!lifecycle) return;

    quoteRequest?.abort();
    const { snapshot, currency, coins, catalog } = get();
    const ids = portfolioCoinIds(snapshot);
    if (ids.length === 0) {
      set({ prices: {}, loadingQuotes: false });
      return;
    }

    const request = new AbortController();
    quoteRequest = request;
    set({ loadingQuotes: true });

    if (!catalog && !loadingCatalog && needsCatalog(ids, coins)) {
      const { signal } = lifecycle;
      loadingCatalog = true;
      void loadPortfolioCatalog(signal).then((catalog) => {
        if (signal.aborted) return;
        loadingCatalog = false;
        set({ catalog });
      });
    }

    const prices = await loadPortfolioPrices(ids, currency, request.signal);
    if (request.signal.aborted || quoteRequest !== request) return;

    quoteRequest = undefined;
    set({ prices, loadingQuotes: false });
  };

  const replaceSnapshot = (snapshot: PortfolioSnapshot) => {
    set({ snapshot, readFailed: false });
    void loadQuotes();
  };

  const applySnapshot = (snapshot: PortfolioSnapshot) => {
    const current = get().snapshot;
    if (current === null || snapshot.revision > current.revision) {
      replaceSnapshot(snapshot);
    }
  };

  const retryRead = async () => {
    try {
      set({ snapshot: readPortfolio(), readFailed: false, writable: canWritePortfolio() });
      await loadQuotes();
    } catch {
      set({ readFailed: true });
    }
  };

  const close = () => {
    unsubscribe?.();
    unsubscribe = undefined;
    lifecycle?.abort();
    lifecycle = undefined;
    quoteRequest?.abort();
    quoteRequest = undefined;
    loadingCatalog = false;
  };

  return {
    initial: null,
    snapshot: null,
    readFailed: false,
    coins: null,
    catalog: null,
    prices: {},
    loadingCoins: false,
    loadingQuotes: false,
    currency: "RUB",
    writable: false,
    saveStatus: "idle",
    errors: {},
    setInitialData: (initial) => {
      close();
      lifecycle = new AbortController();
      set({
        initial,
        snapshot: initial.snapshot,
        readFailed: initial.snapshot === null,
        coins: initial.coins,
        catalog: initial.catalog,
        currency: initial.currency,
        prices: initial.prices,
        loadingCoins: false,
        loadingQuotes: false,
        writable: canWritePortfolio(),
        saveStatus: "idle",
        errors: {}
      });
      unsubscribe = subscribePortfolio(applySnapshot, () => set({ readFailed: true }));
      if (initial.snapshot) {
        try {
          applySnapshot(readPortfolio());
        } catch {
          set({ readFailed: true });
        }
      }
    },
    retryRead,
    retryCoins: async () => {
      const signal = lifecycle?.signal;
      if (!signal || get().loadingCoins) return;

      set({ loadingCoins: true });
      const coins = await loadPortfolioCoins(signal).catch(() => null);
      if (!signal.aborted) set({ coins, loadingCoins: false });
    },
    loadQuotes,
    close,
    setCurrency: (currency) => {
      if (currency === get().currency) return;

      set({ currency, prices: {} });
      void loadQuotes();
    },
    clearFieldError: (field) => {
      const { errors } = get();
      if (errors[field]) set({ errors: { ...errors, [field]: undefined } });
    },
    dismissSuccess: () => set({ saveStatus: "idle" }),
    submit: async (draft) => {
      const { snapshot, currency, coins, saveStatus, readFailed, writable } = get();
      const signal = lifecycle?.signal;
      if (!signal || !snapshot || !coins || readFailed || !writable || saveStatus === "saving") {
        return "ignored";
      }

      const { coinId } = draft;
      const quantity = parsePositiveDecimal(draft.quantity);
      const unitPrice = parsePositiveDecimal(draft.unitPrice);
      const validCoin = coins.some((coin) => coin.id === coinId);
      if (!validCoin || quantity === null || unitPrice === null) {
        set({
          saveStatus: "idle",
          errors: {
            ...(!validCoin && { coinId: "Выберите монету." }),
            ...(quantity === null && { quantity: "Введите количество больше нуля." }),
            ...(unitPrice === null && { unitPrice: "Введите цену больше нуля." })
          }
        });
        return "rejected";
      }

      set({ saveStatus: "saving", errors: {} });
      const rubPerUsd = await readRubPerUsd(signal);
      if (signal.aborted) return "ignored";
      if (rubPerUsd === null) {
        set({ saveStatus: "rate-error" });
        return "rejected";
      }

      try {
        const result = await appendPurchase(
          { coinId, quantity, unitPrice, currency, rubPerUsd },
          snapshot.revision
        );
        if (signal.aborted) return result.kind === "saved" ? "saved" : "ignored";

        if (result.kind === "conflict" && get().snapshot === snapshot) {
          replaceSnapshot(result.snapshot);
        } else {
          applySnapshot(result.snapshot);
        }
        set({ saveStatus: result.kind });
        return result.kind === "saved" ? "saved" : "rejected";
      } catch {
        if (!signal.aborted) set({ saveStatus: "write-error" });
        return "rejected";
      }
    }
  };
});
