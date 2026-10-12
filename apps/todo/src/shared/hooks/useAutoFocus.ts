import { useEffect, useRef } from "react";

export const useAutoFocus = <T extends HTMLInputElement | HTMLTextAreaElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.focus();
    const end = element.value.length;
    element.setSelectionRange(end, end);
  }, []);

  return {
    state: { ref }
  };
};
