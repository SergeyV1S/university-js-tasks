import { create } from "zustand";

import { debounce } from "@/shared/helpers/debounce";
import { apiClient, TOP_MARKETS_PAGE_SIZE } from "@/shared/market/client";
import { createMarketResource, isRecoverableMarketError } from "@/shared/market/resource";
import type { MarketResult } from "@/shared/market/resource";
import type { Coin, GlobalMetrics, MarketError } from "@/shared/market/type";

import { initialSort, loadMatches, missingMarketFields } from "./api";
import type { Catalog, HomeInitialData } from "./api";
import { emptyRange, LAST_TOP_PAGE } from "./constants";
import { parsePrice } from "./helpers/selectRows";
import type { PriceRange, Sort, SortKey } from "./helpers/selectRows";

type HomeState = {
  initial: HomeInitialData | null;
  top: Coin[] | null;
  topPage: number;
  loadingMore: boolean;
  loadMoreError: MarketError | null;
  metrics: GlobalMetrics | null;
  updatedAt: number | null;
  query: string;
  results: Coin[] | null;
  searching: boolean;
  searchError: MarketError | null;
  topError: MarketError | null;
  metricsError: MarketError | null;
  tableRefreshing: boolean;
  metricsRefreshing: boolean;
  rowRefresh: number;
  range: PriceRange;
  sort: Sort;
  sortedByUser: boolean;
  setInitialData: (data: HomeInitialData) => void;
  setQuery: (value: string) => void;
  setRange: (min: string, max: string) => void;
  sortBy: (key: SortKey) => void;
  loadNextPage: () => Promise<void>;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  stop: () => void;
};

const POLL_INTERVAL = 60_000;

const appendNewCoins = (current: Coin[], next: Coin[]): Coin[] => {
  const coins = new Map(current.map((coin) => [coin.id, coin]));
  for (const coin of next) {
    if (!coins.has(coin.id)) coins.set(coin.id, coin);
  }
  return [...coins.values()];
};

export const useHomeStore = create<HomeState>()((set, get) => {
  let catalog: Catalog | undefined;
  let lastTop: Coin[] | null = null;
  let lastMetrics: GlobalMetrics | null = null;
  let lastSearch: { query: string; results: Coin[] } | undefined;
  let table: ReturnType<typeof createMarketResource<Coin[]>> | undefined;
  let metrics: ReturnType<typeof createMarketResource<GlobalMetrics>> | undefined;
  let more: ReturnType<typeof createMarketResource<Coin[]>> | undefined;
  let pollTimer: ReturnType<typeof setInterval> | undefined;

  const createTop = (initial?: MarketResult<Coin[]>) =>
    createMarketResource({
      initial,
      previous: get().top,
      retainOnFailure: true,
      load: (signal) => {
        const ids = get().top?.map(({ id }) => id);
        return apiClient.getMarkets(ids?.length ? ids : undefined, { signal });
      },
      onState: (resource) => {
        const { top, topPage, rowRefresh } = get();
        const incoming = resource.status === "ready" ? resource.data : null;
        const refreshStarted = resource.status === "refreshing";
        const error = resource.error;
        if (incoming === null) {
          set({ topError: error, tableRefreshing: refreshStarted });
          return;
        }

        const restart = !top?.length;
        const quotes = new Map(incoming.map((coin) => [coin.id, coin]));
        const nextTop = restart
          ? appendNewCoins([], incoming)
          : top.map((coin) => quotes.get(coin.id) ?? { ...coin, ...missingMarketFields });
        lastTop = nextTop.slice(0, TOP_MARKETS_PAGE_SIZE);
        set({
          top: nextTop,
          topPage: restart ? (incoming.length > 0 || topPage === 0 ? 1 : topPage) : topPage,
          topError: null,
          tableRefreshing: false,
          updatedAt: Date.now(),
          rowRefresh: rowRefresh + 1
        });
      }
    });

  const scheduleSearch = debounce(() => void table?.run(), 300);

  const stopPolling = () => {
    if (pollTimer !== undefined) clearInterval(pollTimer);
    pollTimer = undefined;
  };

  const stop = () => {
    stopPolling();
    scheduleSearch.cancel();
    table?.stop();
    metrics?.stop();
    more?.stop();
    table = undefined;
    metrics = undefined;
    more = undefined;
  };

  const refresh = async () => {
    const { loadingMore, tableRefreshing, metricsRefreshing, searching } = get();
    if (tableRefreshing || metricsRefreshing) return;

    await Promise.all([loadingMore || searching ? undefined : table?.run(), metrics?.run()]);
  };

  return {
    initial: null,
    top: null,
    topPage: 0,
    loadingMore: false,
    loadMoreError: null,
    metrics: null,
    updatedAt: null,
    query: "",
    results: null,
    searching: false,
    searchError: null,
    topError: null,
    metricsError: null,
    tableRefreshing: false,
    metricsRefreshing: false,
    rowRefresh: 0,
    range: emptyRange,
    sort: initialSort,
    sortedByUser: false,

    setInitialData: (data) => {
      stop();
      catalog = undefined;
      const cachedTop = data.top.error ? lastTop : null;
      set({
        initial: data,
        top: cachedTop,
        topPage: cachedTop === null ? 0 : 1,
        loadingMore: false,
        loadMoreError: null,
        metrics: null,
        updatedAt: null,
        query: "",
        results: null,
        searching: false,
        searchError: null,
        topError: null,
        metricsError: null,
        tableRefreshing: false,
        metricsRefreshing: false,
        rowRefresh: 0,
        range: emptyRange,
        sort: initialSort,
        sortedByUser: false
      });
      table = createTop(data.top);
      metrics = createMarketResource({
        initial: data.metrics,
        previous: lastMetrics,
        retainOnFailure: true,
        load: (signal) => apiClient.getGlobal({ signal }),
        onState: ({ status, data, error }) => {
          if (status === "ready") lastMetrics = data;
          set({
            metrics: data,
            metricsError: error,
            metricsRefreshing: status === "refreshing",
            ...(status === "ready" && { updatedAt: Date.now() })
          });
        }
      });
    },

    setQuery: (value) => {
      const query = value.trim().toLowerCase();
      const { query: current, topError } = get();
      if (query === current.trim().toLowerCase()) {
        set({ query: value });
        return;
      }
      scheduleSearch.cancel();
      table?.stop();
      more?.stop();
      more = undefined;
      set({
        query: value,
        loadMoreError: null,
        results: null,
        searching: Boolean(query),
        searchError: null,
        tableRefreshing: false,
        loadingMore: false
      });
      if (!query) {
        table = createTop(topError ? { data: null, error: topError } : undefined);
        return;
      }

      const cachedSearch = lastSearch?.query === query ? lastSearch.results : null;
      table = createMarketResource({
        previous: cachedSearch,
        retainOnFailure: true,
        load: async (signal) => {
          const entries = catalog ?? (await apiClient.getCatalog({ signal }));
          signal.throwIfAborted();
          catalog = entries;
          const { top, results, topError } = get();
          const reusableQuotes = results === null && !topError ? (top ?? []) : [];
          return loadMatches(entries, query, reusableQuotes, signal);
        },
        onState: ({ status, data, error }) => {
          if (status === "ready" && data) lastSearch = { query, results: data };
          set(({ rowRefresh }) => ({
            results: data,
            searching: status === "initial",
            tableRefreshing: status === "refreshing",
            searchError: error,
            ...(status === "ready" && { updatedAt: Date.now(), rowRefresh: rowRefresh + 1 })
          }));
        }
      });
      scheduleSearch();
    },

    setRange: (min, max) => {
      const lower = parsePrice(min);
      const upper = parsePrice(max);
      if (Number.isNaN(lower) || Number.isNaN(upper)) return;

      if (lower !== null && upper !== null && lower > upper) {
        set({ range: { min: upper, max: lower } });
        return;
      }

      set({ range: { min: lower, max: upper } });
    },

    sortBy: (key) => {
      const { sort } = get();
      const direction =
        sort.key === key
          ? sort.direction === "asc"
            ? "desc"
            : "asc"
          : key === "price"
            ? "desc"
            : "asc";
      set({ sort: { key, direction }, sortedByUser: true });
    },

    loadNextPage: async () => {
      const { top, topPage, query, tableRefreshing } = get();
      if (top === null || topPage >= LAST_TOP_PAGE || tableRefreshing || query.trim()) return;
      if (more) return more.run();

      const page = topPage + 1;
      more = createMarketResource({
        retainOnFailure: false,
        load: (signal) => apiClient.getMarkets(undefined, { page, signal }),
        onState: ({ status, data, error }) => {
          if (status === "ready" && data) {
            set(({ top }) => ({
              top: appendNewCoins(top ?? [], data),
              topPage: page,
              loadMoreError: null,
              loadingMore: false
            }));
            more = undefined;
          } else {
            set({
              loadMoreError: error,
              loadingMore: status === "initial" || status === "refreshing"
            });
            if (error && status === "unavailable" && !isRecoverableMarketError(error)) {
              more = undefined;
            }
          }
        }
      });
      await more.run();
    },

    refresh,
    startPolling: () => {
      if (pollTimer === undefined) pollTimer = setInterval(refresh, POLL_INTERVAL);
    },
    stopPolling,
    stop
  };
});
