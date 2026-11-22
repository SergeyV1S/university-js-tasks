import { create } from "zustand";

import { apiClient } from "../../shared/api/client";
import type { Coin } from "../../shared/api/client";
import { initialSort, loadHome, loadMatches } from "./api";
import type { Catalog, HomeInitialData } from "./api";
import { debounce } from "./helpers/debounce";
import { parsePrice } from "./helpers/selectRows";
import type { PriceRange, Sort, SortKey } from "./helpers/selectRows";

type HomeState = {
  initial: HomeInitialData | null;
  top: Coin[] | null;
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
  refresh: () => Promise<void>;
  stop: () => void;
};

const emptyRange: PriceRange = { min: null, max: null };

export const useHomeStore = create<HomeState>()((set, get) => {
  let catalog: Catalog | undefined;
  let searchRequest: AbortController | undefined;
  let refreshRequest: AbortController | undefined;

  const search = async (query: string, controller: AbortController) => {
    const { signal } = controller;
    try {
      const entries = catalog ?? await apiClient.getCatalog({ signal });
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

  const stop = () => {
    stopSearch();
    refreshRequest?.abort();
    refreshRequest = undefined;
  };

  return {
    initial: null,
    top: null,
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
        top: data.top,
        metrics: data.metrics,
        updatedAt: data.updatedAt,
        marketError: data.top === null || data.metrics === null,
        query: "",
        results: null,
        searching: false,
        searchError: false,
        refreshing: false,
        range: emptyRange,
        sort: initialSort,
        sortedByUser: false,
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
      const direction = sort.key === key
        ? (sort.direction === "asc" ? "desc" : "asc")
        : (key === "price" ? "desc" : "asc");
      set({ sort: { key, direction }, sortedByUser: true });
    },

    refresh: async () => {
      if (refreshRequest) return;
      const controller = new AbortController();
      refreshRequest = controller;
      set({ refreshing: true });

      try {
        const data = await loadHome(controller.signal);
        if (refreshRequest !== controller) return;
        const { top, metrics, updatedAt, query, searching } = get();
        set({
          top: data.top ?? top,
          metrics: data.metrics ?? metrics,
          marketError: data.top === null || data.metrics === null,
          updatedAt: data.top !== null || data.metrics !== null ? data.updatedAt : updatedAt,
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

    stop,
  };
});
