import type { Currency } from "../types";

type CurrencyTitleProps = {
  currency: Currency;
};

export const CurrencyTitle = ({ currency }: CurrencyTitleProps) => (
  <span className='block min-w-0 text-left'>
    <span className='block text-code font-bold'>{currency.code}</span>
    <span className='block truncate text-caption'>{currency.name}</span>
  </span>
);
