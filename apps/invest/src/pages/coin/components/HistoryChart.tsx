import type { HistorySeries } from "../actions";
import { useHistoryChart } from "../hooks/historyChart";

type HistoryChartProps = { series: HistorySeries };

export const HistoryChart = ({ series }: HistoryChartProps) => {
  const { canvas, label } = useHistoryChart(series);
  return (
    <div className='relative -top-2.75 h-38.25 lg:top-0 lg:h-70'>
      <canvas ref={canvas} role='img' aria-label={label} />
    </div>
  );
};
