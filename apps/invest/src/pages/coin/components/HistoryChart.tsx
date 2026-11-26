import type { HistoryDays } from "@/shared/api/requests";

import { useHistoryChart } from "../hooks/historyChart";

type HistoryChartProps = { prices: Array<[number, number]>; period: HistoryDays };

export const HistoryChart = ({ prices, period }: HistoryChartProps) => {
  const { canvas, label } = useHistoryChart(prices, period);
  return (
    <div className='relative -top-2.75 h-38.25 lg:top-0 lg:h-70'>
      <canvas ref={canvas} role='img' aria-label={label} />
    </div>
  );
};
