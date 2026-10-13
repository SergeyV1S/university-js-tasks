import { useEffect, useState } from "react";
import { fetchCurrencies, getFallbackCurrencies } from "../api/fetchCurrencies";

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState(getFallbackCurrencies);

  useEffect(() => {
    const controller = new AbortController();

    fetchCurrencies(controller.signal)
      .then(setCurrencies)
      .catch(() => undefined);

    return () => controller.abort();
  }, []);

  return {
    state: { currencies }
  };
};
