import { marketApi } from "@/shared/api/instance";

import { isRecord } from "../../../helpers/index.ts";
import type { RequestArgs } from "../../index.d.ts";
import { readObject, readQuotes } from "../helpers/index.ts";
import type { Currency } from "../types.ts";

const currencies = ["USD", "EUR", "BTC", "RUB"] as const satisfies readonly Currency[];

export const getExchangeRates = async ({ config }: RequestArgs = {}) => {
  const { data } = await marketApi.get<unknown>("exchange_rates", config);
  const rates = readObject(readObject(data).rates);
  return readQuotes(currencies, (code) => {
    const rate = rates[code];
    return isRecord(rate) ? rate.value : undefined;
  });
};
