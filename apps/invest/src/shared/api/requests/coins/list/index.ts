import { marketApi } from "@/shared/api/instance";

import type { RequestArgs } from "../../../index.d.ts";
import { readArray, readObject } from "../../helpers/index.ts";
import { readCoinIdentity } from "../helpers/index.ts";

export const getCoinsList = async ({ config }: RequestArgs = {}) => {
  const { data } = await marketApi.get<unknown>("coins/list", {
    ...config,
    params: { include_platform: false }
  });
  const coins = readArray(data).map((coin) => readCoinIdentity(readObject(coin)));
  return [...new Map(coins.map((coin) => [coin.id, coin])).values()];
};
