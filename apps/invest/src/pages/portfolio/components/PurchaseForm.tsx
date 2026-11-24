import type { Ref } from "react";

import { ApiText } from "@/shared/ui/ApiText";
import { Banner } from "@/shared/ui/Banner";
import { Button } from "@/shared/ui/Button";
import { Form } from "@/shared/ui/Form";
import { FormField } from "@/shared/ui/FormField";
import { Icon } from "@/shared/ui/Icon";
import { Input } from "@/shared/ui/Input";

import { usePurchaseForm } from "../hooks/usePurchaseForm";
import { PurchaseCoinPicker } from "./PurchaseCoinPicker";

const notices = {
  "rate-error": ["Курс USD/RUB недоступен", "Повторите сохранение чуть позже."],
  "write-error": ["Не удалось сохранить покупку", "Проверьте хранилище и повторите."],
  conflict: ["Портфель изменился в другой вкладке", "Повторите сохранение этой покупки."]
} as const;

type PurchaseFormProps = {
  className: string;
  mobileAdd: boolean;
  mobileHeading: Ref<HTMLHeadingElement>;
  onSaved: () => void;
};

export const PurchaseForm = ({
  className,
  mobileAdd,
  mobileHeading,
  onSaved
}: PurchaseFormProps) => {
  const form = usePurchaseForm(onSaved);
  const coinId = `${form.id}-coin`;
  const quantityId = `${form.id}-quantity`;
  const priceId = `${form.id}-price`;
  const notice =
    form.saveStatus in notices ? notices[form.saveStatus as keyof typeof notices] : null;

  return (
    <Form
      aria-labelledby={`${form.id}-title`}
      className={`min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-4.25 pt-3.5 pb-2.5 ${className}`}
      onSubmit={form.handleSubmit}
    >
      <div id={`${form.id}-title`}>
        {mobileAdd && (
          <h1 ref={mobileHeading} tabIndex={-1} className='text-invest-block lg:hidden'>
            Добавить покупку
          </h1>
        )}
        <h2 className={`text-invest-block ${mobileAdd ? "hidden lg:block" : ""}`}>
          Добавить покупку
        </h2>
      </div>
      {form.coins === null && (
        <Banner role='status' className='mt-3 grid gap-2 p-3 text-invest-label'>
          {form.autoRetryCoins ? (
            "Данные временно недоступны"
          ) : (
            <>
              Не удалось загрузить список монет
              <Button
                onClick={form.retryCoins}
                disabled={form.loadingCoins}
                className='h-11 justify-self-start px-4'
              >
                {form.loadingCoins ? "Загрузка…" : "Повторить"}
              </Button>
            </>
          )}
        </Banner>
      )}
      <fieldset disabled={form.fieldsDisabled || form.coins === null} className='mt-4.25 min-w-0'>
        <PurchaseCoinPicker
          id={coinId}
          coins={form.coins ?? []}
          query={form.query}
          selection={form.draft.coinId}
          error={form.errors.coinId}
          onQuery={form.handleQuery}
          onSelect={form.handleSelect}
        />
        <div className='mt-4'>
          <FormField id={quantityId} label='Количество' error={form.errors.quantity}>
            <div className='relative'>
              <Input
                id={quantityId}
                inputMode='decimal'
                autoComplete='off'
                placeholder='0,00'
                value={form.draft.quantity}
                aria-invalid={Boolean(form.errors.quantity)}
                aria-describedby={form.errors.quantity ? `${quantityId}-error` : undefined}
                onChange={form.handleQuantityChange}
                className={`h-invest-input-height font-invest-numeric ${form.symbol ? "pr-16" : ""}`}
              />
              {form.symbol && (
                <span className='pointer-events-none absolute inset-y-0 right-2.5 flex max-w-12 items-center overflow-hidden font-invest-numeric text-invest-compact-number text-invest-muted uppercase'>
                  <ApiText value={form.symbol} />
                </span>
              )}
            </div>
          </FormField>
        </div>
        <div className='mt-2.25'>
          <FormField id={priceId} label='Цена за одну монету' error={form.errors.unitPrice}>
            <div className='relative'>
              <Input
                id={priceId}
                inputMode='decimal'
                autoComplete='off'
                placeholder='0,00'
                value={form.draft.unitPrice}
                aria-invalid={Boolean(form.errors.unitPrice)}
                aria-describedby={form.errors.unitPrice ? `${priceId}-error` : undefined}
                onChange={form.handlePriceChange}
                className='h-invest-input-height pr-16 font-invest-numeric'
              />
              <span className='pointer-events-none absolute inset-y-0 right-2.5 flex w-10.5 items-center justify-end font-invest-numeric text-invest-compact-number text-invest-muted'>
                {form.currency}
              </span>
            </div>
          </FormField>
        </div>
        {notice && (
          <Banner
            role='status'
            className='mt-2.75 flex min-h-18.5 items-start gap-2.25 px-3 py-2.75'
          >
            <Icon name='alert' className='mt-0.5 size-4.5 shrink-0' />
            <div>
              <p className='text-invest-label'>{notice[0]}</p>
              <p className='mt-0.75 text-invest-caption text-invest-muted'>{notice[1]}</p>
            </div>
          </Banner>
        )}
        <Button
          type='submit'
          variant='primary'
          disabled={form.fieldsDisabled || form.coins === null}
          className={`invest-press h-invest-button-height w-full ${notice ? "mt-1" : "mt-3.75"}`}
        >
          {form.saving ? "Сохранение…" : "Сохранить покупку"}
        </Button>
      </fieldset>
    </Form>
  );
};
