import { useEffect, useState } from "react";
import { useToast } from "@/shared/ui";
import { fetchCurrencies, getFallbackCurrencies } from "../api/fetchCurrencies";
import { CURRENCY_REQUEST_TIMEOUT } from "../constants";

export const useCurrencies = () => {
  const [currencies, setCurrencies] = useState(getFallbackCurrencies);
  const { showToast } = useToast();

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;
    const timeout = window.setTimeout(() => controller.abort(), CURRENCY_REQUEST_TIMEOUT);

    fetchCurrencies(controller.signal)
      .then((data) => {
        if (isActive) setCurrencies(data);
      })
      .catch(() => {
        if (!isActive) return;

        showToast({
          message: "Не удалось обновить курсы валют. Используются сохранённые курсы.",
          variant: "error"
        });
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [showToast]);

  return {
    state: { currencies }
  };
};
