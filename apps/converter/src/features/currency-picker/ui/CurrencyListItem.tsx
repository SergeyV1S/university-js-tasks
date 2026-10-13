import { CurrencyTitle, type Currency } from "@/entities/currency";
import { checkIcon } from "@/shared/assets";

type CurrencyListItemProps = {
  currency: Currency;
  isSelected: boolean;
  onSelect: (code: string) => void;
};

export const CurrencyListItem = ({ currency, isSelected, onSelect }: CurrencyListItemProps) => (
  <li>
    <button
      type='button'
      aria-current={isSelected}
      className='flex w-full items-center justify-between gap-4 rounded-card bg-surface px-4 py-[15px] shadow-item inset-shadow-item transition active:bg-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
      onClick={() => onSelect(currency.code)}
    >
      <CurrencyTitle currency={currency} />
      {isSelected && <img src={checkIcon} alt='' className='block shrink-0' />}
    </button>
  </li>
);
