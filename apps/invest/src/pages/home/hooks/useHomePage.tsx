import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

import { formatTime } from "../../../shared/helpers/format";
import { initialSort } from "../api";
import { selectRows } from "../helpers/selectRows";
import type { useHome } from "./useHome";

const coinCount = new Intl.NumberFormat("ru");
const plural = new Intl.PluralRules("ru");
const countNoun: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: "монета",
  few: "монеты",
  many: "монет"
};
const sortLabels = {
  rank: "По рангу",
  name: "По названию",
  price: "По цене",
  change24h: "По изменению за 24 ч",
  marketCap: "По капитализации"
};

export const useHomePage = (state: ReturnType<typeof useHome>) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [showCapitalization, setShowCapitalization] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const filterButton = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  const { query = "", sort = initialSort } = state ?? {};
  const searchingCatalog = query.trim() !== "";
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
  const rangeLabel =
    min != null && max != null
      ? `$${coinCount.format(min)}–${coinCount.format(max)}`
      : min != null
        ? `от $${coinCount.format(min)}`
        : max != null
          ? `до $${coinCount.format(max)}`
          : "";
  const countLabel = state?.searching
    ? "Поиск монет…"
    : `${coinCount.format(rows.length)} ${countNoun[plural.select(rows.length)] ?? "монет"}`;
  const statusLabel = state?.refreshing
    ? "Обновляем котировки…"
    : hasError
      ? "Обновление приостановлено"
      : state?.updatedAt
        ? `Обновлено в ${formatTime(state.updatedAt)}`
        : "Загрузка котировок…";

  const refreshQuotes = () => {
    setDismissed(false);
    void state?.refresh();
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
