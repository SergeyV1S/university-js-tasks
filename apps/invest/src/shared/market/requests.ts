import type { RequestOptions } from "./type.ts";
import type { createMarketInstance } from "./instance.ts";

type MarketsParams = {
  vs_currency: "usd";
  order: "market_cap_desc";
  per_page: number;
  page: number;
  ids?: string;
};

type PricesParams = { ids: string; vs_currencies: string };

const marketsRequest = (params: MarketsParams) => ({ url: "coins/markets", method: "GET", params });
const pricesRequest = (params: PricesParams) => ({ url: "simple/price", method: "GET", params });

export const createMarketRequests = ({
  request,
  getUri
}: ReturnType<typeof createMarketInstance>) => ({
  getCoinsList: (options?: RequestOptions) =>
    request<unknown>(
      { url: "coins/list", method: "GET", params: { include_platform: false } },
      options
    ),

  getCoinsMarkets: (params: MarketsParams, options?: RequestOptions) =>
    request<unknown>(marketsRequest(params), options),

  getCoinMarketChart: (id: string, days: number, options?: RequestOptions) =>
    request<unknown>(
      {
        url: `coins/${encodeURIComponent(id)}/market_chart`,
        method: "GET",
        params: { vs_currency: "usd", days }
      },
      options
    ),

  getGlobalMarketData: (options?: RequestOptions) =>
    request<unknown>({ url: "global", method: "GET" }, options),

  getSimplePrice: (params: PricesParams, options?: RequestOptions) =>
    request<unknown>(pricesRequest(params), options),

  getExchangeRates: (options?: RequestOptions) =>
    request<unknown>({ url: "exchange_rates", method: "GET" }, options),

  getCoinsMarketsUri: (params: MarketsParams) => getUri(marketsRequest(params)),
  getSimplePriceUri: (params: PricesParams) => getUri(pricesRequest(params))
});
