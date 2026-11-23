import { create } from "zustand";

import { apiClient } from "@/shared/api/client";
import type { Coin } from "@/shared/api/type";
import { debounce } from "@/shared/helpers/debounce";

import { initialSort, loadHome, loadMatches } from "./api";
import type { Catalog, HomeInitialData } from "./api";
import { parsePrice } from "./helpers/selectRows";
import type { PriceRange, Sort, SortKey } from "./helpers/selectRows";
import { emptyRange, LAST_TOP_PAGE } from "./constants";

type HomeState = {
  initial: HomeInitialData | null;
  top: Coin[] | null;
  topPage: number;
  loadingMore: boolean;
  loadMoreError: boolean;
  metrics: HomeInitialData["metrics"];
  updatedAt: number | null;
  query: string;
  results: Coin[] | null;
  searching: boolean;
  searchError: boolean;
  marketError: boolean;
  refreshing: boolean;
  range: PriceRange;
  sort: Sort;
  sortedByUser: boolean;
  setInitialData: (data: HomeInitialData) => void;
  setQuery: (value: string) => void;
  setRange: (min: string, max: string) => void;
  sortBy: (key: SortKey) => void;
  loadNextPage: () => Promise<void>;
  refresh: () => Promise<void>;
  stop: () => void;
};

const appendNewCoins = (current: Coin[], next: Coin[]): Coin[] => {
  const coins = new Map(current.map((coin) => [coin.id, coin]));
  for (const coin of next) {
    if (!coins.has(coin.id)) coins.set(coin.id, coin);
  }
  return [...coins.values()];
};

export const useHomeStore = create<HomeState>()((set, get) => {
  let catalog: Catalog | undefined;
  let searchRequest: AbortController | undefined;
  let pageRequest: AbortController | undefined;
  let refreshRequest: AbortController | undefined;

  const search = async (query: string, controller: AbortController) => {
    const { signal } = controller;
    try {
      const entries = catalog ?? (await apiClient.getCatalog({ signal }));
      if (searchRequest !== controller || signal.aborted) return;

      catalog = entries;
      const results = await loadMatches(entries, query, get().top ?? [], signal);
      if (searchRequest !== controller || signal.aborted) return;

      set({ results, searching: false });
    } catch {
      if (searchRequest === controller && !signal.aborted) {
        set({ results: null, searching: false, searchError: true });
      }
    }
  };

  const scheduleSearch = debounce(search, 300);

  const stopSearch = () => {
    scheduleSearch.cancel();
    searchRequest?.abort();
    searchRequest = undefined;
  };

  const stopPaging = () => {
    pageRequest?.abort();
    pageRequest = undefined;
  };

  const stop = () => {
    stopSearch();
    stopPaging();
    refreshRequest?.abort();
    refreshRequest = undefined;
  };

  return {
    initial: null,
    top: null,
    topPage: 0,
    loadingMore: false,
    loadMoreError: false,
    metrics: null,
    updatedAt: null,
    query: "",
    results: null,
    searching: false,
    searchError: false,
    marketError: false,
    refreshing: false,
    range: emptyRange,
    sort: initialSort,
    sortedByUser: false,

    setInitialData: (data) => {
      stop();
      catalog = undefined;
      set({
        initial: data,
        top: !data.top ? null : appendNewCoins([], data.top),
        topPage: !data.top ? 0 : 1,
        loadingMore: false,
        loadMoreError: false,
        metrics: data.metrics,
        updatedAt: data.updatedAt,
        marketError: !data.top || !data.metrics,
        query: "",
        results: null,
        searching: false,
        searchError: false,
        refreshing: false,
        range: emptyRange,
        sort: initialSort,
        sortedByUser: false
      });
    },

    setQuery: (value) => {
      if (value === get().query) return;
      stopSearch();
      const query = value.trim().toLowerCase();
      if (query === "") {
        set({ query: value, results: null, searching: false, searchError: false });
        return;
      }

      set({ query: value, searching: true, searchError: false });
      searchRequest = new AbortController();
      scheduleSearch(query, searchRequest);
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
      const { top, topPage, query } = get();
      if (pageRequest || refreshRequest || top === null || topPage >= LAST_TOP_PAGE || query.trim())
        return;

      const page = topPage + 1;
      const controller = new AbortController();
      pageRequest = controller;
      set({ loadingMore: true, loadMoreError: false });

      try {
        const next = await apiClient.getMarkets(undefined, { page, signal: controller.signal });
        if (pageRequest !== controller) return;
        set(({ top }) => ({ top: appendNewCoins(top ?? [], next), topPage: page }));
      } catch {
        if (pageRequest === controller) set({ loadMoreError: true });
      } finally {
        if (pageRequest === controller) {
          pageRequest = undefined;
          set({ loadingMore: false });
        }
      }
    },

    refresh: async () => {
      if (refreshRequest) return;
      const currentTop = get().top;
      const ids = currentTop?.length ? currentTop.map(({ id }) => id) : undefined;
      const controller = new AbortController();
      refreshRequest = controller;
      if (!ids) stopPaging();
      set({ refreshing: true, loadingMore: Boolean(pageRequest) });

      try {
        const data = await loadHome(controller.signal, ids);
        if (refreshRequest !== controller) return;
        const { top, topPage, loadMoreError, metrics, updatedAt, query, searching } = get();
        const incoming = data.top;
        const restartTop = !ids && incoming !== null && (top === null || incoming.length > 0);
        let refreshedTop = top;
        if (restartTop) {
          refreshedTop = appendNewCoins([], incoming);
        } else if (ids && top && incoming !== null) {
          const quotes = new Map(incoming.map((coin) => [coin.id, coin]));
          refreshedTop = top.map((coin) => quotes.get(coin.id) ?? coin);
        }
        set({
          top: refreshedTop,
          topPage: restartTop ? 1 : topPage,
          loadMoreError: restartTop ? false : loadMoreError,
          metrics: data.metrics ?? metrics,
          marketError: incoming === null || data.metrics === null,
          updatedAt: incoming !== null || data.metrics !== null ? data.updatedAt : updatedAt
        });

        if (!searching && query.trim()) {
          stopSearch();
          searchRequest = new AbortController();
          set({ searching: true, searchError: false });
          await search(query.trim().toLowerCase(), searchRequest);
        }
      } catch (error) {
        if (!controller.signal.aborted) throw error;
      } finally {
        if (refreshRequest === controller) {
          refreshRequest = undefined;
          set({ refreshing: false });
        }
      }
    },

    stop
  };
});
