import { useEffect, useMemo, useRef } from "react";

import type { CatalogCoin } from "@/shared/market/type";
import { formatPercent } from "@/shared/helpers/format";

import type { Allocation } from "../types";

const colorTokens = [
  "--color-invest-accent",
  "--color-invest-blue",
  "--color-invest-lavender",
  "--color-invest-positive",
  "--color-invest-negative"
];
const coinPlural = new Intl.PluralRules("ru");
const labels = { one: "монета", few: "монеты", many: "монет", other: "монет" } as const;
const emptyAllocations: Allocation[] = [];

export const usePortfolioAllocation = (
  coins: ReadonlyMap<string, CatalogCoin>,
  allocations = emptyAllocations
) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const rows = useMemo(
    () =>
      allocations.map(({ coinId, percent }, index) => ({
        coinId,
        name: coins.get(coinId)?.name ?? coinId,
        symbol: coins.get(coinId)?.symbol,
        percentLabel: formatPercent(percent),
        marker: `var(${colorTokens[index % colorTokens.length]})`
      })),
    [allocations, coins]
  );

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    let active = true;
    let destroyChart: (() => void) | undefined;
    void import("../helpers/allocationChart").then(({ createAllocationChart }) => {
      if (!active) return;

      const styles = getComputedStyle(element);
      const colors = allocations.map((_, index) =>
        styles.getPropertyValue(colorTokens[index % colorTokens.length]).trim()
      );
      destroyChart = createAllocationChart(element, allocations, colors);
    });

    return () => {
      active = false;
      destroyChart?.();
    };
  }, [allocations]);

  const count = rows.length;
  const form = coinPlural.select(count);
  return {
    canvas,
    rows,
    count,
    countLabel: form === "one" || form === "few" || form === "many" ? labels[form] : labels.other
  };
};
