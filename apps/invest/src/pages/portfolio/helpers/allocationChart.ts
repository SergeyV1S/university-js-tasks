import { ArcElement, Chart, DoughnutController } from "chart.js";

import type { Allocation } from "../types";

Chart.register(ArcElement, DoughnutController);

export const createAllocationChart = (
  canvas: HTMLCanvasElement,
  allocations: Allocation[],
  colors: string[]
) => {
  const chart = new Chart(canvas, {
    type: "doughnut",
    data: {
      datasets: [
        {
          data: allocations.map(({ percent }) => percent),
          backgroundColor: colors,
          borderWidth: 0,
          spacing: 2
        }
      ]
    },
    options: {
      animation: false,
      events: [],
      cutout: "65%",
      radius: "96%"
    }
  });
  return () => chart.destroy();
};
