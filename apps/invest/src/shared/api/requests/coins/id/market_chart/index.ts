import { marketApi } from "@/shared/api/instance";

import { marketError } from "../../../../../market/index.ts";
import type { RequestArgs } from "../../../../index.d.ts";
import { isNumber, readArray, readObject } from "../../../helpers/index.ts";

export type HistoryDays = 1 | 7 | 30 | 365;
type MarketChartParams = { id: string; days: HistoryDays };

export const getCoinsIdMarketChart = async ({
  params: { id, days },
  config
}: RequestArgs<MarketChartParams>): Promise<Array<[number, number]>> => {
  if (id === "" || id === "." || id === "..") throw marketError("not-found");

  const { data } = await marketApi.get<unknown>(`coins/${encodeURIComponent(id)}/market_chart`, {
    ...config,
    params: { vs_currency: "usd", days }
  });
  return readArray(readObject(data).prices).map((sample) => {
    const [timestamp, price] = readArray(sample);
    if (!isNumber(timestamp) || !isNumber(price)) throw marketError("invalid-response");
    return [timestamp, price];
  });
};
