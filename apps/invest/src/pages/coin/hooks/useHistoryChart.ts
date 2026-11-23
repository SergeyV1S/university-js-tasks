import { useEffect, useRef } from "react";

import type { HistoryDays } from "@/shared/api/type";
import { formatMoney } from "@/shared/helpers/format";

import { createHistoryChart } from "../helpers/historyChart";

export const useHistoryChart = (prices: Array<[number, number]>, period: HistoryDays) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = prices.at(-1)?.[1] ?? null;
  const label = `График цены в USD. Последняя цена ${formatMoney(latest)}`;

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;

    const desktop = window.matchMedia("(min-width: 64rem)");
    let chart: ReturnType<typeof createHistoryChart> | undefined;
    const render = () => {
      chart?.destroy();
      chart = createHistoryChart(element, prices, period, desktop.matches);
    };

    render();
    desktop.addEventListener("change", render);
    void document.fonts.ready.then(() => chart?.update("none"));

    return () => {
      desktop.removeEventListener("change", render);
      chart?.destroy();
      chart = undefined;
    };
  }, [prices, period]);

  return { canvas, label };
};
