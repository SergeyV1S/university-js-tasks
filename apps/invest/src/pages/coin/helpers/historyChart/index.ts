import {
  BarController,
  BarElement,
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";
import type { ChartOptions } from "chart.js";

import type { HistoryDays } from "@/shared/api/requests";
import { formatMoney } from "@/shared/helpers";

import type { HistorySeries } from "../../actions";

Chart.register(
  BarController,
  BarElement,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
);

const halfCandleInterval = 15 * 60_000;

const time = new Intl.DateTimeFormat("ru", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const date = new Intl.DateTimeFormat("ru", { day: "numeric", month: "short", timeZone: "UTC" });
const month = new Intl.DateTimeFormat("ru", { month: "short", timeZone: "UTC" });
const axisPrice = new Intl.NumberFormat("ru", { maximumSignificantDigits: 6 });
const compactPrice = new Intl.NumberFormat("ru", { notation: "compact", maximumFractionDigits: 1 });

const formatTick = (timestamp: number, period: HistoryDays, edge: boolean) => {
  const value = new Date(timestamp);
  if (Number.isNaN(value.getTime())) return "";
  if (period === 1) return time.format(value);
  if (period !== 365) return date.format(value).replace(/\.$/, "");

  const label = month.format(value).replace(/\.$/, "");
  return edge ? `${label} ${value.getUTCFullYear()}` : label;
};

export const createHistoryChart = (
  canvas: HTMLCanvasElement,
  series: HistorySeries,
  desktop: boolean
) => {
  const css = getComputedStyle(canvas);
  const token = (name: string) => css.getPropertyValue(`--${name}`).trim();
  const color = token("color-invest-muted");
  const divider = token("color-invest-divider");
  const axisFont = {
    family: token(desktop ? "font-invest-numeric" : "font-invest-ui"),
    size: desktop ? 12 : 11,
    weight: 500
  };
  const { period } = series;
  const first = period === 1 ? series.candles[0].timestamp : series.prices[0][0];
  const last =
    period === 1
      ? series.candles[series.candles.length - 1].timestamp
      : series.prices[series.prices.length - 1][0];
  const singlePointPadding = first === last ? 60_000 : 0;
  const timePadding = period === 1 ? halfCandleInterval : singlePointPadding;
  const scales = {
    x: {
      type: "linear",
      offset: false,
      min: first - timePadding,
      max: last + timePadding,
      afterBuildTicks: (axis) => {
        axis.ticks = (
          first === last
            ? [first]
            : [first, first + (last - first) / 3, first + ((last - first) * 2) / 3, last]
        ).map((value) => ({ value }));
      },
      border: { display: false },
      grid: { display: false },
      ticks: {
        align: "inner",
        autoSkip: false,
        maxRotation: 0,
        color,
        font: axisFont,
        padding: 4,
        callback: (value, index, ticks) =>
          formatTick(Number(value), period, index === 0 || index === ticks.length - 1)
      }
    },
    y: {
      type: "linear",
      afterFit: (axis) => {
        axis.width = Math.max(axis.width, desktop ? 55 : 52);
      },
      border: { display: false },
      grid: { color: divider, drawTicks: false },
      ticks: {
        maxTicksLimit: 4,
        color,
        font: axisFont,
        padding: desktop ? 6 : 8,
        callback: (value) =>
          (Math.abs(Number(value)) >= 1e6 ? compactPrice : axisPrice).format(Number(value))
      }
    }
  } satisfies NonNullable<ChartOptions<"line" | "bar">["scales"]>;
  const options = {
    maintainAspectRatio: false,
    interaction: { mode: "nearest", axis: "x", intersect: false },
    layout: { padding: { top: desktop ? 14 : 0, right: desktop ? 17 : 4 } },
    scales
  } as const;

  if (period === 1) {
    const { candles } = series;
    const positive = token("color-invest-positive");
    const negative = token("color-invest-negative");
    const colors = candles.map(({ open, close }) => {
      if (close === open) return color;
      return close > open ? positive : negative;
    });

    return new Chart<"bar", Array<{ x: number; y: [number, number] }>>(canvas, {
      type: "bar",
      data: {
        datasets: [
          {
            data: candles.map(({ timestamp, open, close }) => ({ x: timestamp, y: [open, close] })),
            backgroundColor: colors,
            grouped: false,
            maxBarThickness: 12,
            minBarLength: 1
          },
          {
            data: candles.map(({ timestamp, low, high }) => ({ x: timestamp, y: [low, high] })),
            backgroundColor: colors,
            grouped: false,
            order: 1,
            barThickness: 1,
            inflateAmount: 0
          }
        ]
      },
      options: {
        ...options,
        scales: { ...scales, y: { ...scales.y, beginAtZero: false, grace: "5%" } },
        plugins: {
          tooltip: {
            filter: ({ datasetIndex }) => datasetIndex === 0,
            callbacks: {
              title: ([point]) =>
                point ? `${formatTick(point.parsed.x ?? first, period, true)} UTC` : "",
              label: ({ dataIndex }) => {
                const { open, high, low, close } = candles[dataIndex];
                return [
                  `Открытие: ${formatMoney(open)}`,
                  `Максимум: ${formatMoney(high)}`,
                  `Минимум: ${formatMoney(low)}`,
                  `Закрытие: ${formatMoney(close)}`
                ];
              }
            }
          }
        }
      }
    });
  }

  const { prices } = series;
  const accent = token("color-invest-accent");
  const fillTop = token("color-invest-chart-fill-top");
  const fillBottom = token("color-invest-chart-fill-bottom");

  return new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        {
          data: prices.map(([x, y]) => ({ x, y })),
          borderColor: accent,
          borderWidth: 2,
          clip: 4,
          fill: "start",
          backgroundColor: ({ chart }) => {
            if (!chart.chartArea) return "transparent";
            const gradient = chart.ctx.createLinearGradient(
              0,
              chart.chartArea.top,
              0,
              chart.chartArea.bottom
            );
            gradient.addColorStop(0, fillTop);
            gradient.addColorStop(1, fillBottom);
            return gradient;
          },
          pointRadius: ({ dataIndex }) => (dataIndex === prices.length - 1 ? 3.5 : 0),
          pointBackgroundColor: accent,
          pointBorderWidth: 0,
          pointHoverRadius: 4
        }
      ]
    },
    options: {
      ...options,
      parsing: false,
      plugins: {
        tooltip: {
          callbacks: {
            title: ([point]) => (point ? formatTick(point.parsed.x ?? first, period, true) : ""),
            label: (point) => formatMoney(point.parsed.y)
          }
        }
      }
    }
  });
};
