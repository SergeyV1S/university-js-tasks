import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

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
  const [dismissed, setDismissed] = useState(false);
  const filterButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const { query = "", sort = initialSort } = state ?? {};
  const searchingCatalog = query.trim() !== "";
  const pagination = state &&
    !searchingCatalog &&
    state.topPage > 0 &&
    state.topPage < LAST_TOP_PAGE && {
      page: state.topPage,
      loading: state.loadingMore,
      failed: state.loadMoreError,
      paused: state.refreshing,
      loadNext: state.loadNextPage
    };

  const rows = state
    ? selectRows(state.results ?? (state.searching || !searchingCatalog ? (state.top ?? []) : []), {
        ...state.range,
        sort,
        includeUnranked: searchingCatalog && !state.sortedByUser
      })
    : [];

  const hasError = state?.marketError || state?.searchError;
  const showError = hasError && !dismissed;
  const unavailable = Boolean(state && (searchingCatalog ? state.searchError : state.top === null));
  const min = state?.range.min;
  const max = state?.range.max;
  const hasRange = min != null || max != null;
  const rangeLabel = selectRangeLabel(coinCount, min, max);
  const statusLabel = selectStatusLabel(state?.refreshing, hasError, state?.updatedAt);
  const countLabel = state?.searching
    ? "Поиск монет…"
    : `${coinCount.format(rows.length)} ${countNoun[plural.select(rows.length)] ?? "монет"}`;

  const refreshQuotes = () => {
    setDismissed(false);
    state?.refresh();
  };

  const dismissError = () => setDismissed(true);
  const toggleCapitalization = () => setShowCapitalization((current) => !current);
  const toggleFilter = () => setFilterOpen((current) => !current);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDismissed(false);
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
      hasError,
      hasRange,
      pagination,
      query,
      rangeLabel,
      rows,
      searchingCatalog,
      showCapitalization,
      showError,
      sort,
      sortLabel: sortLabels[sort.key],
      statusLabel,
      unavailable
    },
    refs: { filterButton, searchInput },
    functions: {
      applyPriceRange,
      clearSearch,
      dismissError,
      handleSearchChange,
      refreshQuotes,
      toggleCapitalization,
      toggleFilter
    }
  };
};
