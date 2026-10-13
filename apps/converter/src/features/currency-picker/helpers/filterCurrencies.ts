import type { Currency } from "@/entities/currency";

export const filterCurrencies = (currencies: Currency[], query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  return currencies.filter(
    (currency) =>
      currency.code.toLowerCase().includes(normalizedQuery) ||
      currency.name.toLowerCase().includes(normalizedQuery)
  );
};
