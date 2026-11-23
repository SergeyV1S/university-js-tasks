import { useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { useNoticeDismissal } from "@/shared/hooks/useNoticeDismissal";
import { marketNotice, selectMarketError } from "@/shared/market/notice";
import { isRecoverableMarketError } from "@/shared/market/resource";

import { useHomeStore } from "../homeStore";
import { initialSort } from "../api";
import { selectRangeLabel } from "../helpers/selectRangeLabel";
import { selectRows } from "../helpers/selectRows";
import { selectStatusLabel } from "../helpers/selectStatusLabel";
import { LAST_TOP_PAGE } from "../constants";
import type { useHome } from "./useHome";
import { coinCount, countNoun, plural, sortLabels } from "../constants";

export const useHomePage = (state: ReturnType<typeof useHome>) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCapitalization, setShowCapitalization] = useState(false);
  const filterButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const scrollBeforeRefresh = useRef<number>(null);
  const rowRefresh = state?.rowRefresh;
  useLayoutEffect(
    () =>
      useHomeStore.subscribe((current, previous) => {
        if (current.rowRefresh !== previous.rowRefresh && previous.tableRefreshing) {
          scrollBeforeRefresh.current ??= window.scrollY;
        }
      }),
    []
  );
  useLayoutEffect(() => {
    const scroll = scrollBeforeRefresh.current;
    const viewport = document.scrollingElement;
    if (scroll === null || !viewport) return;
    scrollBeforeRefresh.current = null;
    window.scrollTo({
      top: Math.min(scroll, viewport.scrollHeight - viewport.clientHeight),
      behavior: "instant"
    });
  }, [rowRefresh]);

  const { query = "", sort = initialSort } = state ?? {};
  const searchingCatalog = query.trim() !== "";
  const pagination = state &&
    !searchingCatalog &&
    state.topPage > 0 &&
    state.topPage < LAST_TOP_PAGE && {
      page: state.topPage,
      loading: state.loadingMore,
      failed: Boolean(state.loadMoreError),
      paused: state.tableRefreshing || isRecoverableMarketError(state.loadMoreError),
      loadNext: state.loadNextPage
    };

  const rows = state
    ? selectRows(state.results ?? (state.searching || !searchingCatalog ? (state.top ?? []) : []), {
        ...state.range,
        sort,
        includeUnranked: searchingCatalog && !state.sortedByUser
      })
    : [];

  const tableError = searchingCatalog ? state?.searchError : state?.topError;
  const tableData = searchingCatalog ? state?.results : state?.top;
  const paginationError = isRecoverableMarketError(state?.loadMoreError)
    ? state?.loadMoreError
    : null;
  const error = selectMarketError(tableError, state?.metricsError, paginationError);
  const tableStale = Boolean(tableError && tableData !== null);
  const metricsStale = Boolean(state?.metricsError && state.metrics);
  const stale = tableStale || metricsStale;
  const bothStale = tableStale && metricsStale;
  const unavailable = Boolean(state && tableError && tableData === null);
  const refreshing = Boolean(state?.tableRefreshing || state?.metricsRefreshing);
  const { visible, dismiss } = useNoticeDismissal(error?.kind);
  const notice =
    error && visible
      ? marketNotice(
          error,
          state?.searchError
            ? "Не удалось выполнить поиск"
            : "Не удалось загрузить рыночные данные",
          stale
        )
      : undefined;
  const min = state?.range.min;
  const max = state?.range.max;
  const hasRange = min != null || max != null;
  const rangeLabel = selectRangeLabel(coinCount, min, max);
  const statusLabel = selectStatusLabel(refreshing, bothStale, Boolean(error), state?.updatedAt);
  const countLabel = state?.searching
    ? "Поиск монет…"
    : `${coinCount.format(rows.length)} ${countNoun[plural.select(rows.length)] ?? "монет"}`;

  const refreshQuotes = () => {
    void state?.refresh();
  };

  const toggleCapitalization = () => setShowCapitalization((current) => !current);
  const toggleFilter = () => setFilterOpen((current) => !current);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    state?.setQuery(event.currentTarget.value);
  };

  const clearSearch = () => {
    state?.setQuery("");
    searchInput.current?.focus();
  };

  const applyPriceRange = (min: string, max: string) => {
    state?.setRange(min, max);
    setFilterOpen(false);
    filterButton.current?.focus();
  };

  return {
    state: {
      countLabel,
      filterOpen,
      hasError: Boolean(error),
      hasRange,
      pagination,
      query,
      rangeLabel,
      rows,
      searchingCatalog,
      showCapitalization,
      notice,
      refreshing,
      metricsStale,
      tableStale,
      bothStale,
      retryManually: Boolean(error && !isRecoverableMarketError(error)),
      sort,
      sortLabel: sortLabels[sort.key],
      statusLabel,
      unavailable
    },
    refs: { filterButton, searchInput },
    functions: {
      applyPriceRange,
      clearSearch,
      dismissError: dismiss,
      handleSearchChange,
      refreshQuotes,
      toggleCapitalization,
      toggleFilter
    }
  };
};
