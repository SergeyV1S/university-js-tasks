import { useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { useNoticeDismissal } from "@/shared/hooks";
import { isRecoverableMarketError, marketNotice, selectMarketError } from "@/shared/market";

import { useHomeStore } from "../store";
import { initialSort } from "../actions";
import {
  getRefreshIcon,
  getStaleDescriptionId,
  selectRangeLabel,
  selectRows,
  selectStatusLabel
} from "../helpers";
import { LAST_TOP_PAGE, coinCount, countNoun, plural, sortLabels } from "../constants";
import type { useHome } from "./useHome";

export const useHomePage = (state: ReturnType<typeof useHome>) => {
  const [filter, setFilter] = useState({ open: false, session: 0 });
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
  const canPaginate =
    state && !searchingCatalog && state.topPage > 0 && state.topPage < LAST_TOP_PAGE;
  const pagination = canPaginate
    ? {
        page: state.topPage,
        loading: state.loadingMore,
        failed: Boolean(state.loadMoreError),
        paused: state.tableRefreshing || isRecoverableMarketError(state.loadMoreError),
        loadNext: state.loadNextPage
      }
    : undefined;

  const tableData = searchingCatalog ? state?.results : state?.top;
  const rows = state
    ? selectRows(tableData ?? [], {
        ...state.range,
        sort,
        includeUnranked: searchingCatalog && !state.sortedByUser
      })
    : [];

  const tableError = searchingCatalog ? state?.searchError : state?.topError;
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
  const noticeTitle = state?.searchError
    ? "Не удалось выполнить поиск"
    : "Не удалось загрузить рыночные данные";
  const notice = error && visible ? marketNotice(error, noticeTitle, stale) : undefined;
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
  const toggleFilter = () =>
    setFilter((current) =>
      current.open ? { ...current, open: false } : { open: true, session: current.session + 1 }
    );

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    state?.setQuery(event.currentTarget.value);
  };

  const clearSearch = () => {
    state?.setQuery("");
    searchInput.current?.focus();
  };

  const applyPriceRange = (min: string, max: string) => {
    state?.setRange(min, max);
    setFilter((current) => ({ ...current, open: false }));
    filterButton.current?.focus();
  };

  return {
    state: {
      countLabel,
      filterOpen: filter.open,
      filterSession: filter.session,
      hasError: Boolean(error),
      hasRange,
      pagination,
      tableLoading: !state || state.searching,
      query,
      rangeLabel,
      rows,
      searchingCatalog,
      showCapitalization,
      notice,
      refreshIcon: getRefreshIcon(refreshing, Boolean(error)),
      metricsStale,
      tableStale,
      bothStale,
      metricsDescriptionId: getStaleDescriptionId("metrics-stale", metricsStale, bothStale),
      tableDescriptionId: getStaleDescriptionId("table-stale", tableStale, bothStale),
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
