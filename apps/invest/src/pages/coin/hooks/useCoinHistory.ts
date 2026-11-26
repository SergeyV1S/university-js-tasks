import type { HistoryDays } from "@/shared/api/requests";

import { initialPeriod } from "../actions";
import { getHistoryView } from "../helpers";
import { useCoinStore } from "../store";

const periods = [
  { days: 1, label: "1 д" },
  { days: 7, label: "7 д" },
  { days: 30, label: "30 д" },
  { days: 365, label: "1 год" }
] as const satisfies ReadonlyArray<{ days: HistoryDays; label: string }>;

export const useCoinHistory = (pending: boolean) => {
  const history = useCoinStore((state) => state.history);
  const period = useCoinStore((state) => state.period);
  const setPeriod = useCoinStore((state) => state.setPeriod);
  const active = pending ? initialPeriod : period;

  const options = periods.map((option) => ({
    ...option,
    selected: option.days === active,
    select: () => {
      void setPeriod(option.days);
    }
  }));

  return { options, view: getHistoryView(pending ? null : history) };
};
