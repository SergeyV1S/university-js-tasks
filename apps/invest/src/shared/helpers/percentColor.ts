export const percentColor = (value: number | null) => {
  if (value === null || value === 0) return "text-invest-foreground";
  return value > 0 ? "text-invest-positive" : "text-invest-negative";
};
