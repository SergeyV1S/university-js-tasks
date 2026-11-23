import type { Coin } from "@/shared/market/type";
import { ApiText } from "@/shared/ui/ApiText";
import { CoinAvatar } from "@/shared/ui/CoinAvatar";
import { FormField } from "@/shared/ui/FormField";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";

import { usePurchaseCoinPicker } from "../hooks/usePurchaseCoinPicker";

type PurchaseCoinPickerProps = {
  id: string;
  coins: Coin[];
  selection: string;
  query: string;
  error?: string;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
};

export const PurchaseCoinPicker = ({
  id,
  coins,
  selection,
  query,
  error,
  onQuery,
  onSelect
}: PurchaseCoinPickerProps) => {
  const picker = usePurchaseCoinPicker(coins, selection, query, onQuery, onSelect);
  const selectionId = `${id}-selected`;

  return (
    <FormField id={id} label='Монета' error={error}>
      <div className='relative mt-px'>
        {picker.open && (
          <Icon
            name='search'
            className='pointer-events-none absolute top-3.5 left-3 text-invest-muted'
          />
        )}
        <Input
          id={id}
          role='combobox'
          aria-autocomplete='list'
          aria-expanded={picker.open}
          aria-controls={picker.open ? picker.listId : undefined}
          aria-activedescendant={picker.activeId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : picker.coinLabel ? selectionId : undefined}
          autoComplete='off'
          placeholder={picker.coinLabel ? undefined : "Выберите из топ-100"}
          value={query}
          onChange={picker.handleChange}
          onClick={picker.handleClick}
          onBlur={picker.close}
          onKeyDown={picker.handleKeyDown}
          className={`h-invest-input-height pr-9 ${picker.open ? "pl-9.25" : ""} ${picker.coinLabel ? "caret-transparent" : ""}`}
        />
        {picker.coinLabel && (
          <span
            id={selectionId}
            className={`pointer-events-none absolute inset-y-0 right-9 flex items-center ${picker.open ? "left-9.25" : "left-3"}`}
          >
            <span className='truncate'>
              <ApiText value={picker.coinLabel} />
            </span>
          </span>
        )}
        <Icon
          name='chevron'
          className='pointer-events-none absolute top-3.75 right-3.5 size-4 text-invest-muted'
        />
      </div>
      {picker.open && (
        <div className='mt-0.75 rounded-invest-input border border-invest-divider bg-invest-background p-1.25 pb-3'>
          <p className='px-1 pt-0.75 pb-1.25 text-invest-note text-invest-muted'>
            Результаты поиска по названию
          </p>
          <div
            id={picker.listId}
            role='listbox'
            aria-label='Монеты из топ-100'
            className='grid max-h-35.25 gap-0.75 overflow-y-auto'
          >
            {picker.options.map(({ coin, id: optionId, active, select }) => (
              <div
                key={coin.id}
                id={optionId}
                role='option'
                aria-selected={active}
                onMouseDown={picker.handleMouseDown}
                onClick={select}
                className='flex h-11.25 cursor-pointer items-center gap-2 rounded-md px-1.75 hover:bg-invest-raised aria-selected:bg-invest-raised'
              >
                <CoinAvatar coin={coin} size='compact' />
                <span className='grid min-w-0 flex-1 text-invest-label'>
                  <span className='truncate'>
                    <ApiText value={coin.name} />
                  </span>
                  {coin.symbol && (
                    <span className='truncate font-invest-numeric text-invest-note text-invest-muted uppercase'>
                      <ApiText value={coin.symbol} />
                    </span>
                  )}
                </span>
                {coin.rank !== null && (
                  <span className='font-invest-numeric text-invest-compact-number text-invest-muted'>
                    #{coin.rank}
                  </span>
                )}
              </div>
            ))}
          </div>
          {picker.options.length === 0 && (
            <p role='status' className='px-1 pb-1 text-invest-caption text-invest-muted'>
              Монеты не найдены
            </p>
          )}
        </div>
      )}
    </FormField>
  );
};
