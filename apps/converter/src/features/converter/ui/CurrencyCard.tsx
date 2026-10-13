import { CurrencyTitle, type Currency } from "@/entities/currency";
import { chevronRightIcon } from "@/shared/assets";
import { cn } from "@/shared/helpers";

type CurrencyCardProps = {
  currency: Currency;
  value: string;
  isActive: boolean;
  onActivate: () => void;
  onChangeCurrency: () => void;
};

export const CurrencyCard = ({
  currency,
  value,
  isActive,
  onActivate,
  onChangeCurrency
}: CurrencyCardProps) => (
  <section className='rounded-card bg-surface px-3.5 pt-3 pb-3.5 shadow-card inset-shadow-card'>
    <button
      type='button'
      title='Изменить валюту'
      className='flex w-full items-center justify-between gap-4 rounded-field focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
      onClick={onChangeCurrency}
    >
      <CurrencyTitle currency={currency} />
      <img src={chevronRightIcon} alt='' className='mr-2 block shrink-0' />
    </button>

    <button
      type='button'
      aria-pressed={isActive}
      className={cn(
        "mt-3.5 flex h-[57px] w-full items-center justify-center rounded-field px-4",
        "bg-linear-to-b from-field from-40% to-field-shade text-amount font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        isActive ? "text-accent" : "text-foreground"
      )}
      onClick={onActivate}
    >
      <span className='truncate'>{value}</span>
    </button>
  </section>
);
