import {
  Chart,
  Filler,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
} from "chart.js";

import type { HistoryDays } from "@/shared/market/type";
import { formatMoney } from "@/shared/helpers/format";

Chart.register(Filler, LineController, LineElement, LinearScale, PointElement, Tooltip);

type HistoryPoints = Array<[number, number]>;

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
  prices: HistoryPoints,
  period: HistoryDays,
  desktop: boolean
) => {
  const css = getComputedStyle(canvas);
  const token = (name: string) => css.getPropertyValue(`--${name}`).trim();
  const accent = token("color-invest-accent");
  const color = token("color-invest-muted");
  const divider = token("color-invest-divider");
  const fillTop = token("color-invest-chart-fill-top");
  const fillBottom = token("color-invest-chart-fill-bottom");
  const axisFont = {
    family: token(desktop ? "font-invest-numeric" : "font-invest-ui"),
    size: desktop ? 12 : 11,
    weight: 500
  };
  const first = prices[0][0];
  const last = prices[prices.length - 1][0];

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
      animation: false,
      maintainAspectRatio: false,
      parsing: false,
      interaction: { mode: "nearest", axis: "x", intersect: false },
      layout: { padding: { top: desktop ? 14 : 0, right: desktop ? 17 : 4 } },
      plugins: {
        tooltip: {
          callbacks: {
            title: ([point]) => (point ? formatTick(point.parsed.x ?? first, period, true) : ""),
            label: (point) => formatMoney(point.parsed.y)
          }
        }
      },
      scales: {
        x: {
          type: "linear",
          min: first === last ? first - 60_000 : first,
          max: last === first ? last + 60_000 : last,
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
      }
    }
  });
};
