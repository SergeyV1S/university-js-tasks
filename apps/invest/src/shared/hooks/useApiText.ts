import { useCallback } from "react";

export const useApiText = (value: string) => {
  const setTextContent = useCallback(
    (element: HTMLSpanElement | null) => {
      if (element) element.textContent = value;
    },
    [value]
  );

  return setTextContent;
};
