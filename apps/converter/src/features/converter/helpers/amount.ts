import { DECIMAL_SEPARATOR, MAX_FRACTION_DIGITS, MAX_INTEGER_DIGITS } from "../constants";

export const appendSymbol = (amount: string, symbol: string) => {
  if (symbol === DECIMAL_SEPARATOR) {
    return amount.includes(DECIMAL_SEPARATOR) ? amount : `${amount || "0"}${DECIMAL_SEPARATOR}`;
  }

  const [integerPart, fractionPart] = amount.split(DECIMAL_SEPARATOR);

  if (fractionPart !== undefined) {
    return fractionPart.length < MAX_FRACTION_DIGITS ? amount + symbol : amount;
  }

  if (integerPart === "0") return symbol;

  return integerPart.length < MAX_INTEGER_DIGITS ? amount + symbol : amount;
};

export const removeLastSymbol = (amount: string) => amount.slice(0, -1);

export const parseAmount = (amount: string) => Number(amount.replace(DECIMAL_SEPARATOR, ".")) || 0;

export const formatAmount = (value: number) =>
  value.toLocaleString("ru-RU", {
    maximumFractionDigits: value > 0 && value < 1 ? 4 : MAX_FRACTION_DIGITS,
    useGrouping: false
  });

export const withCurrencySymbol = (amount: string, symbol: string) =>
  symbol.length === 1 ? `${amount}${symbol}` : `${amount} ${symbol}`;
