import { marketApi } from "@/shared/api/instance";

import { isRecord } from "../../../../helpers/index.ts";
import type { RequestArgs } from "../../../index.d.ts";
import { batchByUrl, readObject, readQuotes } from "../../helpers/index.ts";
import type { Currency, Quotes } from "../../types.ts";

type SimplePriceParams = { ids: readonly string[]; currencies: readonly Currency[] };

const SIMPLE_PRICE_MAX_IDS = 515;
const path = "simple/price";

export const getSimplePrice = async ({
  params: { ids, currencies },
  config
}: RequestArgs<SimplePriceParams>): Promise<Record<string, Quotes>> => {
  const requestedCurrencies = [...new Set(currencies)];
  if (requestedCurrencies.length === 0) return {};

  const vsCurrencies = requestedCurrencies.map((currency) => currency.toLowerCase()).join(",");
  const batches = batchByUrl(
    ids,
    SIMPLE_PRICE_MAX_IDS,
    (batch) => ({ ids: batch.join(","), vs_currencies: vsCurrencies }),
    (params) => marketApi.getUri({ ...config, url: path, params })
  );
  const prices: Array<[string, Quotes]> = [];
  for (const { ids: batch, params } of batches) {
    const { data } = await marketApi.get<unknown>(path, { ...config, params });
    const payload = readObject(data);
    for (const id of batch) {
      const values = payload[id];
      if (Object.hasOwn(payload, id) && isRecord(values)) {
        prices.push([id, readQuotes(requestedCurrencies, (code) => values[code])]);
      }
    }
  }
  return Object.fromEntries(prices);
};
