export const replaceCode = (codes: string[], index: number, code: string) => {
  const currentIndex = codes.indexOf(code);

  return codes.map((current, position) => {
    if (position === index) return code;
    if (position === currentIndex) return codes[index];
    return current;
  });
};
