import { isRecord } from "../../../helpers/index.ts";
import { marketError } from "../../../market/index.ts";

import type { Currency, Quotes } from "../types.ts";

const REQUEST_URL_BUDGET = 2_000;

export const readObject = (value: unknown) => {
  if (!isRecord(value)) throw marketError("invalid-response");
  return value;
};

export const readArray = (value: unknown): unknown[] => {
  if (!Array.isArray(value)) throw marketError("invalid-response");
  return value;
};

export const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const numberOrNull = (value: unknown) => (isNumber(value) ? value : null);

export const readQuotes = (
  currencies: readonly Currency[],
  readValue: (code: string) => unknown
) => {
  const quotes: Quotes = {};
  for (const currency of currencies) {
    const value = readValue(currency.toLowerCase());
    if (isNumber(value)) quotes[currency] = value;
  }
  return quotes;
};

export const batchByUrl = <Params>(
  ids: readonly string[],
  maxIds: number,
  buildParams: (ids: string[]) => Params,
  getUri: (params: Params) => string
) => {
  const batches: Array<{ ids: string[]; params: Params }> = [];
  let batch: string[] = [];

  for (const id of new Set(ids)) {
    const nextBatch = [...batch, id];
    if (nextBatch.length <= maxIds && getUri(buildParams(nextBatch)).length <= REQUEST_URL_BUDGET) {
      batch = nextBatch;
      continue;
    }

    if (batch.length > 0) batches.push({ ids: batch, params: buildParams(batch) });
    batch = [id];
    if (getUri(buildParams(batch)).length > REQUEST_URL_BUDGET) {
      throw new RangeError("Coin ID exceeds the CoinGecko request URL budget");
    }
  }

  if (batch.length > 0) batches.push({ ids: batch, params: buildParams(batch) });
  return batches;
};
