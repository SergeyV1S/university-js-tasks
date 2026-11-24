import { Button } from "@/shared/ui/Button";
import { Form } from "@/shared/ui/Form";
import { Input } from "@/shared/ui/Input";

import type { PriceRange } from "../helpers/selectRows";
import { usePriceFilter } from "../hooks/usePriceFilter";

type PriceFilterProps = {
  range: PriceRange;
  onApply: (min: string, max: string) => void;
};

export const PriceFilter = ({ range, onApply }: PriceFilterProps) => {
  const {
    state: { min, max, invalidMin, invalidMax },
    functions
  } = usePriceFilter(range, onApply);

  return (
    <Form
      id='market-price-filter'
      className='mb-3 rounded-[10px] border border-invest-border bg-invest-surface px-2.75 pt-2.5 pb-1.25 lg:pb-3.5'
      onSubmit={functions.handleSubmit}
    >
      <fieldset>
        <legend className='mb-1.5 text-invest-label'>Цена в USD</legend>
        <div className='grid grid-cols-2 gap-x-3 gap-y-1 lg:flex lg:items-start'>
          <label className='relative min-w-0 lg:w-45'>
            <span className='sr-only'>Минимальная цена</span>
            <Input
              type='text'
              inputMode='decimal'
              placeholder='От'
              value={min}
              onChange={functions.handleMinChange}
              aria-invalid={invalidMin || undefined}
              aria-describedby={invalidMin ? "market-price-error" : undefined}
              className='h-10.5 pr-11'
            />
            <span
              aria-hidden='true'
              className='pointer-events-none absolute top-3 right-3 font-invest-numeric text-invest-compact-number text-invest-muted'
            >
              USD
            </span>
          </label>
          <label className='relative min-w-0 lg:w-45'>
            <span className='sr-only'>Максимальная цена</span>
            <Input
              type='text'
              inputMode='decimal'
              placeholder='До'
              value={max}
              onChange={functions.handleMaxChange}
              aria-invalid={invalidMax || undefined}
              aria-describedby={invalidMax ? "market-price-error" : undefined}
              className='h-10.5 pr-11'
            />
            <span
              aria-hidden='true'
              className='pointer-events-none absolute top-3 right-3 font-invest-numeric text-invest-compact-number text-invest-muted'
            >
              USD
            </span>
          </label>
          <Button
            type='submit'
            variant='primary'
            className='invest-press col-start-2 row-start-2 h-10 w-30 justify-self-end'
          >
            Показать
          </Button>
          <Button className='col-start-1 row-start-2 h-10 w-25' onClick={functions.resetRange}>
            Сбросить
          </Button>
        </div>
        {(invalidMin || invalidMax) && (
          <p
            id='market-price-error'
            className='mt-2 text-invest-caption text-invest-negative'
            role='alert'
          >
            Введите число от 0.
          </p>
        )}
      </fieldset>
    </Form>
  );
};
