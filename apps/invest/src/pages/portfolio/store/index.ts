import { create } from "zustand";

import { getExchangeRates } from "@/shared/api/requests";
import { createMarketResource } from "@/shared/market";
import type { CatalogCoin, Coin } from "@/shared/api/requests";
import type { MarketError, MarketResult } from "@/shared/market";
import { isPositiveNumber, parsePositiveDecimal } from "@/shared/helpers";

import {
  loadPortfolioCatalog,
  loadPortfolioCoins,
  loadPortfolioPrices,
  needsCatalog,
  portfolioCoinIds
} from "../actions";
import type { PortfolioInitialData } from "../actions";
import { appendPurchase, canWritePortfolio, readPortfolio, subscribePortfolio } from "../storage";
import type {
  PortfolioCurrency,
  PortfolioSnapshot,
  PurchaseDraft,
  PurchaseErrors,
  SaveStatus
} from "../types";

type Prices = Awaited<ReturnType<typeof loadPortfolioPrices>>;
type Catalog = Awaited<ReturnType<typeof loadPortfolioCatalog>>;
type SubmitResult = "saved" | "rejected" | "ignored";

type PortfolioState = {
  initial: PortfolioInitialData | null;
  snapshot: PortfolioSnapshot | null;
  readFailed: boolean;
  coins: Coin[] | null;
  catalog: Map<string, CatalogCoin> | null;
  prices: Prices;
  priceError: MarketError | null;
  coinsError: MarketError | null;
  catalogError: MarketError | null;
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
    const { RUB, USD } = await getExchangeRates({ config: { signal } });
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
  let quoteResource: ReturnType<typeof createMarketResource<Prices>> | undefined;
  let coinResource: ReturnType<typeof createMarketResource<Coin[]>> | undefined;
  let catalogResource: ReturnType<typeof createMarketResource<Catalog>> | undefined;
  let activeQuoteKey: string | undefined;
  const lastPrices: Partial<Record<PortfolioCurrency, { key: string; prices: Prices }>> = {};

  const createCatalog = (initial?: MarketResult<Catalog>) =>
    createMarketResource({
      initial,
      retainOnFailure: true,
      load: loadPortfolioCatalog,
      onState: ({ data, error }) => set({ catalog: data, catalogError: error })
    });

  const ensureCatalog = (ids: string[]) => {
    if (catalogResource || !needsCatalog(ids, get().coins)) return;
    catalogResource = createCatalog();
    void catalogResource.run();
  };

  const loadQuotes = async (initial?: MarketResult<Prices>) => {
    if (!lifecycle) return;

    const { snapshot, currency, loadingQuotes, priceError } = get();
    const ids = portfolioCoinIds(snapshot).sort((left, right) => left.localeCompare(right));
    const quoteKey = JSON.stringify([currency, ids]);
    const sameParams = activeQuoteKey === quoteKey;
    if (sameParams && loadingQuotes) return;
    if (sameParams && priceError && quoteResource) {
      await quoteResource.run();
      return;
    }

    quoteResource?.stop();
    activeQuoteKey = quoteKey;
    if (ids.length === 0) {
      set({ prices: {}, priceError: null, loadingQuotes: false });
      return;
    }

    ensureCatalog(ids);
    const cached = lastPrices[currency];
    quoteResource = createMarketResource({
      initial,
      previous: cached?.key === quoteKey ? cached.prices : undefined,
      retainOnFailure: true,
      load: (signal) => loadPortfolioPrices(ids, currency, signal),
      onState: ({ status, data, error }) => {
        if (status === "ready" && data) lastPrices[currency] = { key: quoteKey, prices: data };
        const changingParams = !sameParams && status === "refreshing" && !error;
        set({
          prices: changingParams ? {} : (data ?? {}),
          priceError: error,
          loadingQuotes: status === "initial" || status === "refreshing"
        });
      }
    });
    if (!initial) await quoteResource.run();
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
    quoteResource?.stop();
    coinResource?.stop();
    catalogResource?.stop();
    activeQuoteKey = undefined;
    catalogResource = undefined;
  };

  return {
    initial: null,
    snapshot: null,
    readFailed: false,
    coins: null,
    catalog: null,
    prices: {},
    priceError: null,
    coinsError: null,
    catalogError: null,
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
        coins: initial.coins.data,
        catalog: initial.catalog?.data ?? null,
        currency: initial.currency,
        prices: {},
        priceError: null,
        coinsError: null,
        catalogError: null,
        loadingCoins: false,
        loadingQuotes: false,
        writable: canWritePortfolio(),
        saveStatus: "idle",
        errors: {}
      });
      coinResource = createMarketResource({
        initial: initial.coins,
        retainOnFailure: true,
        load: loadPortfolioCoins,
        onState: ({ data, error, status }) =>
          set({
            coins: data,
            coinsError: error,
            loadingCoins: status === "initial" || status === "refreshing"
          })
      });
      if (initial.catalog) catalogResource = createCatalog(initial.catalog);
      void loadQuotes(initial.prices);
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
      if (lifecycle) await coinResource?.run();
    },
    loadQuotes,
    close,
    setCurrency: (currency) => {
      if (currency === get().currency) return;

      set({ currency, prices: {}, priceError: null });
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
