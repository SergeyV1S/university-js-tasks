import { useEffect, useState } from "react";
import { storage } from "@/shared/utils";

export const useLocalStorage = <T>(key: string, initialValue: T | (() => T)) => {
  const [value, setValue] = useState<T>(() => {
    const storedValue = storage.getItem<T>(key);
    if (storedValue !== null) return storedValue;

    return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
  });

  useEffect(() => {
    storage.setItem(key, value);
  }, [key, value]);

  return {
    state: { value },
    functions: { setValue }
  };
};
