import { marketApi } from "@/shared/api/instance";

import { marketError } from "../../../../../market/index.ts";
import type { RequestArgs } from "../../../../index.d.ts";
import { isNumber, readArray } from "../../../helpers/index.ts";

export const getCoinsIdOhlc = async ({ params: { id }, config }: RequestArgs<{ id: string }>) => {
  if (id === "" || id === "." || id === "..") throw marketError("not-found");

  const { data } = await marketApi.get<unknown>(`coins/${encodeURIComponent(id)}/ohlc`, {
    ...config,
    params: { vs_currency: "usd", days: 1 }
  });

  return readArray(data).map((sample) => {
    const [timestamp, open, high, low, close] = readArray(sample);
    if (
      !isNumber(timestamp) ||
      !isNumber(open) ||
      !isNumber(high) ||
      !isNumber(low) ||
      !isNumber(close) ||
      low > Math.min(open, close) ||
      high < Math.max(open, close)
    ) {
      throw marketError("invalid-response");
    }

    return { timestamp, open, high, low, close };
  });
};
