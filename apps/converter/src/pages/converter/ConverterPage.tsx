import { CurrencyCard, Keypad, useConverterApp } from "@/features/converter";
import { CurrencyPicker } from "@/features/currency-picker";
import { ScreenHeader } from "@/shared/ui";

export const ConverterPage = () => {
  const { state, functions } = useConverterApp();

  if (state.isPickerOpen) {
    return (
      <CurrencyPicker
        currencies={state.currencies}
        selectedCodes={state.selectedCodes}
        onSelect={functions.selectCurrency}
        onBack={functions.closePicker}
      />
    );
  }

  return (
    <main className='mx-auto flex min-h-dvh max-w-app flex-col px-5 pb-[46px] short:pb-4'>
      <ScreenHeader title='Конвертер валют' />

      <div className='flex flex-col gap-3.5'>
        {state.cards.map((card) => (
          <CurrencyCard
            key={card.index}
            currency={card.currency}
            value={card.displayValue}
            isActive={card.isActive}
            onActivate={() => functions.activateCard(card.index)}
            onChangeCurrency={() => functions.openPicker(card.index)}
          />
        ))}
      </div>

      <div className='flex flex-1 flex-col justify-end pt-10 short:pt-4'>
        <Keypad onPress={functions.pressKey} />
      </div>
    </main>
  );
};
