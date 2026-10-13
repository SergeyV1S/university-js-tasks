import { useState, type ChangeEvent } from "react";
import type { Currency } from "@/entities/currency";
import { filterCurrencies } from "../helpers/filterCurrencies";

export const useCurrencySearch = (currencies: Currency[], selectedCodes: string[]) => {
  const [query, setQuery] = useState("");

  const items = filterCurrencies(currencies, query).map((currency) => ({
    currency,
    isSelected: selectedCodes.includes(currency.code)
  }));

  const changeQuery = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const clearQuery = () => {
    setQuery("");
  };

  return {
    state: { query, items, hasItems: items.length > 0 },
    functions: { changeQuery, clearQuery }
  };
};
