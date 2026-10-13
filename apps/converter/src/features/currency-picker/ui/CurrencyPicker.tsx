import type { Currency } from "@/entities/currency";
import { ScreenHeader, SearchInput } from "@/shared/ui";
import { useCurrencySearch } from "../hooks/useCurrencySearch";
import { CurrencyListItem } from "./CurrencyListItem";

type CurrencyPickerProps = {
  currencies: Currency[];
  selectedCodes: string[];
  onSelect: (code: string) => void;
  onBack: () => void;
};

export const CurrencyPicker = ({
  currencies,
  selectedCodes,
  onSelect,
  onBack
}: CurrencyPickerProps) => {
  const { state, functions } = useCurrencySearch(currencies, selectedCodes);

  return (
    <main className='min-h-dvh pb-8'>
      <div className='sticky top-0 z-10 bg-background'>
        <div className='mx-auto max-w-app px-5 pb-[22px]'>
          <ScreenHeader title='Изменить валюту' onBack={onBack} />
          <SearchInput
            value={state.query}
            placeholder='Search currency...'
            aria-label='Поиск валюты'
            onChange={functions.changeQuery}
            onClear={functions.clearQuery}
          />
        </div>
      </div>

      {state.hasItems ? (
        <ul className='mx-auto flex max-w-app flex-col gap-3 px-5'>
          {state.items.map((item) => (
            <CurrencyListItem
              key={item.currency.code}
              currency={item.currency}
              isSelected={item.isSelected}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : (
        <p className='mt-4 text-center text-caption text-muted'>Ничего не найдено</p>
      )}
    </main>
  );
};
