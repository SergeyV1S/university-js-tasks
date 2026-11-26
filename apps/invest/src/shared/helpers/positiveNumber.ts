export const isPositiveNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

export const parsePositiveDecimal = (raw: string) => {
  const value = raw.trim();
  if (!/^(?:\d+(?:[.,]\d+)?|[.,]\d+)$/.test(value)) return null;
  const number = Number(value.replace(",", "."));
  return isPositiveNumber(number) ? number : null;
};
