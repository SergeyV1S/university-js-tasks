import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../../../shared/ui/Button";
import { Form } from "../../../shared/ui/Form";
import { Input } from "../../../shared/ui/Input";
import { parsePrice } from "../helpers/selectRows";
import type { PriceRange } from "../helpers/selectRows";

type PriceFilterProps = {
  range: PriceRange;
  onApply: (min: string, max: string) => void;
};

export const PriceFilter = ({ range, onApply }: PriceFilterProps) => {
  const [min, setMin] = useState(String(range.min ?? ""));
  const [max, setMax] = useState(String(range.max ?? ""));
  const [submitted, setSubmitted] = useState(false);
  const invalidMin = submitted && Number.isNaN(parsePrice(min));
  const invalidMax = submitted && Number.isNaN(parsePrice(max));

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);

    if (Number.isNaN(parsePrice(min)) || Number.isNaN(parsePrice(max))) return;
    onApply(min, max);
  };

  return (
    <Form id="market-price-filter" className="rounded-[10px] border border-invest-border bg-invest-surface px-[11px] pt-2.5 pb-[5px] lg:pb-[14px]" onSubmit={apply}>
      <fieldset>
        <legend className="mb-1.5 text-invest-label">Цена в USD</legend>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 lg:flex lg:items-start">
          <label className="relative min-w-0 lg:w-[180px]">
            <span className="sr-only">Минимальная цена</span>
            <Input type="text" inputMode="decimal" placeholder="От" value={min} onChange={(event) => setMin(event.target.value)}
              aria-invalid={invalidMin || undefined} aria-describedby={invalidMin ? "market-price-error" : undefined} className="h-[42px] pr-11" />
            <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 font-invest-numeric text-invest-compact-number text-invest-muted">USD</span>
          </label>
          <label className="relative min-w-0 lg:w-[180px]">
            <span className="sr-only">Максимальная цена</span>
            <Input type="text" inputMode="decimal" placeholder="До" value={max} onChange={(event) => setMax(event.target.value)}
              aria-invalid={invalidMax || undefined} aria-describedby={invalidMax ? "market-price-error" : undefined} className="h-[42px] pr-11" />
            <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 font-invest-numeric text-invest-compact-number text-invest-muted">USD</span>
          </label>
          <Button type="submit" variant="primary" className="col-start-2 row-start-2 h-10 w-[120px] justify-self-end">Показать</Button>
          <Button className="col-start-1 row-start-2 h-10 w-[100px]" onClick={() => onApply("", "")}>Сбросить</Button>
        </div>
        {(invalidMin || invalidMax) && <p id="market-price-error" className="mt-2 text-invest-caption text-invest-negative" role="alert">Введите число от 0.</p>}
      </fieldset>
    </Form>
  );
};
