import { marketApi } from "@/shared/api/instance";

import { isRecord } from "../../../helpers/index.ts";
import type { RequestArgs } from "../../index.d.ts";
import { numberOrNull, readObject } from "../helpers/index.ts";

export type GlobalMetrics = {
  marketCap: number | null;
  marketCapChange24h: number | null;
  volume24h: number | null;
  bitcoinShare: number | null;
  ethereumShare: number | null;
};

export const getGlobal = async ({ config }: RequestArgs = {}): Promise<GlobalMetrics> => {
  const { data: payload } = await marketApi.get<unknown>("global", config);
  const data = readObject(readObject(payload).data);
  const shares = isRecord(data.market_cap_percentage) ? data.market_cap_percentage : {};
  return {
    marketCap: numberOrNull(
      isRecord(data.total_market_cap) ? data.total_market_cap.usd : undefined
    ),
    marketCapChange24h: numberOrNull(data.market_cap_change_percentage_24h_usd),
    volume24h: numberOrNull(isRecord(data.total_volume) ? data.total_volume.usd : undefined),
    bitcoinShare: numberOrNull(shares.btc),
    ethereumShare: numberOrNull(shares.eth)
  };
};
