import { marketApi } from "@/shared/api/instance";

import type { RequestArgs } from "../../../index.d.ts";
import { batchByUrl, numberOrNull, readArray, readObject } from "../../helpers/index.ts";
import { readCoinIdentity } from "../helpers/index.ts";
import type { Coin } from "../types.ts";

type CoinsMarketsParams = { ids?: readonly string[]; page?: number };

export const TOP_MARKETS_PAGE_SIZE = 20;
const MARKETS_MAX_IDS = 250;
const path = "coins/markets";
const usdMarkets = { vs_currency: "usd", order: "market_cap_desc", page: 1 } as const;

const readCoins = (value: unknown) =>
  readArray(value).map((item) => {
    const coin = readObject(item);
    return {
      ...readCoinIdentity(coin),
      ...(typeof coin.image === "string" &&
        coin.image.startsWith("https://") && { image: coin.image }),
      rank: numberOrNull(coin.market_cap_rank),
      price: numberOrNull(coin.current_price),
      change24h: numberOrNull(coin.price_change_percentage_24h),
      marketCap: numberOrNull(coin.market_cap)
    };
  });

export const getCoinsMarkets = async ({
  params: { ids, page = 1 } = {},
  config
}: Partial<RequestArgs<CoinsMarketsParams>> = {}): Promise<Coin[]> => {
  if (ids === undefined) {
    const { data } = await marketApi.get<unknown>(path, {
      ...config,
      params: { ...usdMarkets, per_page: TOP_MARKETS_PAGE_SIZE, page }
    });
    return readCoins(data).slice(0, TOP_MARKETS_PAGE_SIZE);
  }

  const batches = batchByUrl(
    ids,
    MARKETS_MAX_IDS,
    (batch) => ({ ...usdMarkets, per_page: batch.length, ids: batch.join(",") }),
    (params) => marketApi.getUri({ ...config, url: path, params })
  );
  const coins: Coin[] = [];
  for (const { params } of batches) {
    const { data } = await marketApi.get<unknown>(path, { ...config, params });
    coins.push(...readCoins(data));
  }
  return coins;
};
