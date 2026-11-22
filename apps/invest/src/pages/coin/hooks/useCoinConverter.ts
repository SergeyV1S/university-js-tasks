import { useId } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

import type { ConverterData } from "../api";
import { useCoinStore } from "../coinStore";
import { converterCurrencies, formatConversion, isQuote, unavailableRate } from "../helpers/converter";

export const useCoinConverter = (data: ConverterData | undefined) => {
  const inputId = useId();
  const currencyLabelId = useId();
  const quantity = useCoinStore((state) => state.quantity);
  const currency = useCoinStore((state) => state.currency);
  const setQuantity = useCoinStore((state) => state.setQuantity);
  const setCurrency = useCoinStore((state) => state.setCurrency);

  const options = converterCurrencies.map((code) => ({
    code,
    selected: code === (data ? currency : "USD"),
    select: () => setCurrency(code),
  }));

  const hasError = data?.quotes === null || (data?.rates === null && !isQuote(data.quotes?.[currency]));
  const result = hasError ? "Данные временно недоступны" : data?.quotes
    ? formatConversion(quantity, currency, data.quotes, data.rates ?? {})
    : "";
  const resultUnavailable = hasError || result === unavailableRate;
  const changeQuantity = (event: ChangeEvent<HTMLInputElement>) => setQuantity(event.currentTarget.value);
  const preventSubmit = (event: SubmitEvent<HTMLFormElement>) => event.preventDefault();

  return { inputId, currencyLabelId, quantity, options, result, resultUnavailable, changeQuantity, preventSubmit };
};
