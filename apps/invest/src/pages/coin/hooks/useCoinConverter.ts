import { useId } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

import type { Coin } from "@/shared/market/type";

import { needsConverterRates } from "../api";
import { useCoinStore } from "../coinStore";
import {
  converterCurrencies,
  formatConversion,
  isQuote,
  unavailableRate
} from "../helpers/converter";

export const useCoinConverter = (coin: Coin | undefined) => {
  const inputId = useId();
  const currencyLabelId = useId();
  const quantity = useCoinStore((state) => state.quantity);
  const currency = useCoinStore((state) => state.currency);
  const quotes = useCoinStore((state) => state.quotes);
  const rates = useCoinStore((state) => state.rates);
  const setQuantity = useCoinStore((state) => state.setQuantity);
  const setCurrency = useCoinStore((state) => state.setCurrency);

  const options = converterCurrencies.map((code) => ({
    code,
    selected: code === (coin ? currency : "USD"),
    select: () => setCurrency(code)
  }));

  const priceQuotes = quotes?.data;
  const useRates = Boolean(
    priceQuotes && needsConverterRates(priceQuotes) && !isQuote(priceQuotes[currency])
  );
  const conversion = priceQuotes
    ? formatConversion(quantity, currency, priceQuotes, rates?.data ?? {})
    : "";
  const hasError = Boolean(quotes?.error || (useRates && rates?.error));
  const stale = hasError && conversion !== "" && conversion !== unavailableRate;
  const result = hasError && !stale ? "Данные временно недоступны" : conversion;
  const resultUnavailable = (hasError && !stale) || result === unavailableRate;
  const changeQuantity = (event: ChangeEvent<HTMLInputElement>) =>
    setQuantity(event.currentTarget.value);
  const preventSubmit = (event: SubmitEvent<HTMLFormElement>) => event.preventDefault();

  return {
    inputId,
    currencyLabelId,
    quantity,
    options,
    result,
    resultUnavailable,
    stale,
    changeQuantity,
    preventSubmit
  };
};
