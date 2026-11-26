import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { parsePrice } from "../helpers";
import type { PriceRange } from "../helpers";

export const usePriceFilter = (range: PriceRange, onApply: (min: string, max: string) => void) => {
  const [min, setMin] = useState(String(range.min ?? ""));
  const [max, setMax] = useState(String(range.max ?? ""));
  const [submitted, setSubmitted] = useState(false);
  const malformedMin = Number.isNaN(parsePrice(min));
  const malformedMax = Number.isNaN(parsePrice(max));

  const handleMinChange = (event: ChangeEvent<HTMLInputElement>) =>
    setMin(event.currentTarget.value);
  const handleMaxChange = (event: ChangeEvent<HTMLInputElement>) =>
    setMax(event.currentTarget.value);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (malformedMin || malformedMax) return;
    onApply(min, max);
  };

  const resetRange = () => onApply("", "");

  return {
    state: {
      min,
      max,
      invalidMin: submitted && malformedMin,
      invalidMax: submitted && malformedMax
    },
    functions: { handleMinChange, handleMaxChange, handleSubmit, resetRange }
  };
};
