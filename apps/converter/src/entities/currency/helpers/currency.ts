import { capitalize } from "@/shared/helpers";
import { PINNED_CODES, RUB } from "../constants";
import type { CbrCurrency, CbrDailyResponse, Currency } from "../types";

const currencyNames = new Intl.DisplayNames(["ru"], { type: "currency" });

export const getCurrencyName = (code: string, fallbackName: string) => {
  const name = currencyNames.of(code);
  return name && name !== code ? capitalize(name) : fallbackName;
};

export const getCurrencySymbol = (code: string) => {
  try {
    const parts = new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol"
    }).formatToParts(0);

    return parts.find((part) => part.type === "currency")?.value ?? code;
  } catch {
    return code;
  }
};

const toCurrency = (currency: CbrCurrency) => ({
  code: currency.CharCode,
  name: getCurrencyName(currency.CharCode, currency.Name),
  symbol: getCurrencySymbol(currency.CharCode),
  rate: currency.Value / currency.Nominal
});

const getPinnedRank = (code: string) => {
  const index = PINNED_CODES.indexOf(code);
  return index === -1 ? PINNED_CODES.length : index;
};

export const sortCurrencies = (currencies: Currency[]) =>
  [...currencies].sort(
    (a, b) => getPinnedRank(a.code) - getPinnedRank(b.code) || a.name.localeCompare(b.name, "ru")
  );

export const toCurrencyList = (response: CbrDailyResponse) => {
  const cbrCurrencies = Object.values(response.Valute);
  cbrCurrencies.push(RUB);

  return sortCurrencies(cbrCurrencies.map(toCurrency));
};

export const findCurrency = (currencies: Currency[], code: string) =>
  currencies.find((currency) => currency.code === code) ?? currencies[0];

export const convertAmount = (amount: number, from: Currency, to: Currency) =>
  (amount * from.rate) / to.rate;
