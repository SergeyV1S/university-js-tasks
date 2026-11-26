import { useEffect, useRef } from "react";

import { formatMoney } from "@/shared/helpers";
import { useTheme } from "@/shared/theme";

import type { HistorySeries } from "../../actions";
import { createHistoryChart } from "../../helpers/historyChart";

export const useHistoryChart = (series: HistorySeries) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  const label =
    series.period === 1
      ? `График цены в USD. Свечи за 1 день. Последняя цена закрытия ${formatMoney(series.candles.at(-1)?.close ?? null)}`
      : `График цены в USD. Последняя цена ${formatMoney(series.prices.at(-1)?.[1] ?? null)}`;

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    const desktop = window.matchMedia("(min-width: 64rem)");
    let chart: ReturnType<typeof createHistoryChart> | undefined;
    const render = () => {
      chart?.destroy();
      chart = createHistoryChart(element, series, desktop.matches);
    };

    render();
    desktop.addEventListener("change", render);
    void document.fonts.ready.then(() => chart?.update("none"));

    return () => {
      desktop.removeEventListener("change", render);
      chart?.destroy();
      chart = undefined;
    };
  }, [series, theme]);

  return { canvas, label };
};
