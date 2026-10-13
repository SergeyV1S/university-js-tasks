import { CBR_DAILY_URL } from "../constants";
import { toCurrencyList } from "../helpers/currency";
import type { CbrDailyResponse } from "../types";
import fallbackRates from "./fallbackRates.json";

export const getFallbackCurrencies = () => toCurrencyList(fallbackRates);

export const fetchCurrencies = async (signal?: AbortSignal) => {
  const response = await fetch(CBR_DAILY_URL, { signal });

  if (!response.ok) {
    throw new Error(`ЦБ РФ ответил с ошибкой ${response.status}`);
  }

  const data: CbrDailyResponse = await response.json();
  return toCurrencyList(data);
};
