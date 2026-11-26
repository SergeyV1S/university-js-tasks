export const getStaleDescriptionId = (staleId: string, stale: boolean, bothStale: boolean) => {
  if (!stale) return;
  if (bothStale) return "market-refresh-status";
  return staleId;
};

export const getRefreshIcon = (refreshing: boolean, hasError: boolean) => {
  if (refreshing) {
    return { name: "refresh", className: "text-invest-accent motion-safe:animate-spin" } as const;
  }
  if (hasError) return { name: "alert", className: "text-invest-warning" } as const;
  return { name: "check", className: "text-invest-positive" } as const;
};

export const getMetricsState = (loading?: boolean, unavailable?: boolean) => {
  if (loading) return "loading";
  if (unavailable) return "unavailable";
  return "ready";
};
