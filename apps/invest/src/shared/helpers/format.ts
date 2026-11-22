const money = new Intl.NumberFormat("ru", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const smallMoney = new Intl.NumberFormat("ru", { maximumSignificantDigits: 2 });
const compact = new Intl.NumberFormat("ru", { notation: "compact", maximumFractionDigits: 2 });
const percentage = new Intl.NumberFormat("ru", { maximumFractionDigits: 2 });
const time = new Intl.DateTimeFormat("ru", { hour: "2-digit", minute: "2-digit" });

export const formatMoney = (value: number | null) => {
  if (value === null) return "";
  return `$${(value !== 0 && Math.abs(value) < 0.01 ? smallMoney : money).format(value)}`;
};

export const formatCompactMoney = (value: number | null) =>
  value === null ? "" : `$${compact.format(value).replace(/\.$/, "")}`;

export const formatPercent = (value: number | null, signed = false) => {
  if (value === null) return "";
  const sign = value < 0 ? "−" : value > 0 && signed ? "+" : "";
  return `${sign}${percentage.format(Math.abs(value))}%`;
};

export const formatTime = (value: number) => time.format(value);
