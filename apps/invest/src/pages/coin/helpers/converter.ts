import type { Currency, Quotes } from "@/shared/api/requests";

export const converterCurrencies = ["USD", "EUR", "BTC"] as const satisfies readonly Currency[];
export type ConverterCurrency = (typeof converterCurrencies)[number];

export const unavailableRate = "Курс недоступен";

const fiat = new Intl.NumberFormat("ru", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bitcoin = new Intl.NumberFormat("ru", { minimumFractionDigits: 8, maximumFractionDigits: 8 });

export const isQuote = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

const parseQuantity = (raw: string) => {
  const text = raw.trim();
  if (!/^\+?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(text)) return 0;
  const value = Number(text.replace(",", "."));
  return Number.isFinite(value) ? value : 0;
};

const getUnitPrice = (currency: ConverterCurrency, quotes: Quotes, rates: Quotes) => {
  const direct = quotes[currency];
  if (isQuote(direct)) return direct;

  const priceUsd = quotes.USD;
  const usdRate = rates.USD;
  const rate = rates[currency];
  if (isQuote(priceUsd) && isQuote(usdRate) && usdRate > 0 && isQuote(rate) && rate > 0) {
    return priceUsd * (rate / usdRate);
  }
};

export const formatConversion = (
  raw: string,
  currency: ConverterCurrency,
  quotes: Quotes,
  rates: Quotes
) => {
  const unitPrice = getUnitPrice(currency, quotes, rates);
  if (!isQuote(unitPrice)) return unavailableRate;

  const quantity = parseQuantity(raw);
  const amount = quantity * unitPrice;
  if (!Number.isFinite(amount)) return unavailableRate;

  const format = currency === "BTC" ? bitcoin : fiat;
  const step = currency === "BTC" ? 0.00000001 : 0.01;

  if (quantity > 0 && unitPrice > 0 && step - amount > 2 * Number.EPSILON * step) {
    return `< ${format.format(step)} ${currency}`;
  }

  return `${format.format(amount)} ${currency}`;
};
