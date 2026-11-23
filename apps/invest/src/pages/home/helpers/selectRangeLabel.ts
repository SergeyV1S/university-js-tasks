export const selectRangeLabel = (
  coinCount: Intl.NumberFormat,
  min?: number | null,
  max?: number | null
) => {
  if (!min) {
    return !max ? "" : `до $${coinCount.format(max)}`;
  }

  if (!max) {
    return `от $${coinCount.format(min)}`;
  }

  return `$${coinCount.format(min)}–${coinCount.format(max)}`;
};
