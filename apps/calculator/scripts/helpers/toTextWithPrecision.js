const toTextWithPrecision = (number) => String(Number(number.toPrecision(12))).replace(".", ",");

export { toTextWithPrecision };
