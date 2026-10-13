import { useState } from "react";
import { convertAmount, findCurrency, useCurrencies } from "@/entities/currency";
import { useWindowKeyDown } from "@/shared/hooks";
import { DEFAULT_CODES } from "../constants";
import {
  appendSymbol,
  formatAmount,
  parseAmount,
  removeLastSymbol,
  withCurrencySymbol
} from "../helpers/amount";
import { replaceCode } from "../helpers/codes";
import { toKeypadKey } from "../helpers/keyboard";
import type { KeypadKey } from "../types";

export const useConverterApp = () => {
  const currencyList = useCurrencies();
  const [codes, setCodes] = useState(DEFAULT_CODES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [source, setSource] = useState({ index: 0, amount: "" });
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  const currencies = currencyList.state.currencies;
  const sourceCurrency = findCurrency(currencies, codes[source.index]);
  const sourceValue = parseAmount(source.amount);
  const isActiveSource = source.index === activeIndex;

  const cards = codes.map((code, index) => {
    const currency = findCurrency(currencies, code);
    const value =
      index === source.index
        ? source.amount || "0"
        : formatAmount(convertAmount(sourceValue, sourceCurrency, currency));

    return {
      index,
      currency,
      isActive: index === activeIndex,
      value,
      displayValue: withCurrencySymbol(value, currency.symbol)
    };
  });

  const inputSymbol = (symbol: string) => {
    const amount = isActiveSource ? source.amount : "";
    setSource({ index: activeIndex, amount: appendSymbol(amount, symbol) });
  };

  const deleteLastSymbol = () => {
    const amount = isActiveSource ? source.amount : cards[activeIndex].value;
    setSource({ index: activeIndex, amount: removeLastSymbol(amount) });
  };

  const clearAmount = () => {
    setSource({ index: activeIndex, amount: "" });
  };

  const pressKey = (key: KeypadKey) => {
    if (key === "clear") {
      clearAmount();
    } else if (key === "backspace") {
      deleteLastSymbol();
    } else {
      inputSymbol(key);
    }
  };

  const activateCard = (index: number) => {
    setActiveIndex(index);
  };

  const openPicker = (index: number) => {
    setPickerIndex(index);
  };

  const closePicker = () => {
    setPickerIndex(null);
  };

  const selectCurrency = (code: string) => {
    if (pickerIndex !== null) {
      setCodes((prev) => replaceCode(prev, pickerIndex, code));
    }

    closePicker();
  };

  const handleConverterKeyDown = (event: KeyboardEvent) => {
    const key = toKeypadKey(event);
    if (!key) return;

    event.preventDefault();
    pressKey(key);
  };

  const handlePickerKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") closePicker();
  };

  useWindowKeyDown(handleConverterKeyDown, pickerIndex === null);
  useWindowKeyDown(handlePickerKeyDown, pickerIndex !== null);

  return {
    state: {
      currencies,
      cards,
      selectedCodes: codes,
      isPickerOpen: pickerIndex !== null
    },
    functions: {
      pressKey,
      activateCard,
      openPicker,
      closePicker,
      selectCurrency
    }
  };
};
