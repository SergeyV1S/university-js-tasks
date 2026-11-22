import type { Coin } from "../../../shared/api/type";
import { ApiText } from "../../../shared/ui/ApiText";
import { Button } from "../../../shared/ui/Button";
import { Form } from "../../../shared/ui/Form";
import { Input } from "../../../shared/ui/Input";
import { SegmentedControl } from "../../../shared/ui/SegmentedControl";
import { Skeleton } from "../../../shared/ui/Skeleton";
import type { ConverterData } from "../api";
import { useCoinConverter } from "../hooks/useCoinConverter";

type CoinConverterProps = { coin?: Coin; data?: ConverterData };

export const CoinConverter = ({ coin, data }: CoinConverterProps) => {
  const {
    inputId,
    currencyLabelId,
    quantity,
    options,
    result,
    resultUnavailable,
    changeQuantity,
    preventSubmit
  } = useCoinConverter(data);

  return (
    <section
      aria-labelledby='coin-converter-heading'
      className='min-h-74 min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-3.25 pt-3.5 pb-4 lg:px-4.75'
    >
      <h2 id='coin-converter-heading' className='text-invest-block'>
        Конвертер
      </h2>
      <Form className='mt-3.5' onSubmit={preventSubmit}>
        <label htmlFor={inputId} className='block text-invest-label text-invest-muted'>
          Количество
          {coin && (
            <>
              {" "}
              <ApiText value={coin.name} />
            </>
          )}
        </label>
        <div className='relative mt-1.5'>
          <Input
            id={inputId}
            type='text'
            inputMode='decimal'
            autoComplete='off'
            disabled={!data}
            value={data ? quantity : "1"}
            onChange={changeQuantity}
            className='h-invest-input-height pr-20'
          />
          {coin?.symbol && (
            <span
              aria-hidden='true'
              className='pointer-events-none absolute top-1/2 right-3 max-w-16 -translate-y-1/2 truncate font-invest-numeric text-invest-compact-number text-invest-muted uppercase'
            >
              <ApiText value={coin.symbol} />
            </span>
          )}
        </div>
        <p id={currencyLabelId} className='mt-3.75 text-invest-label text-invest-muted'>
          Валюта результата
        </p>
        <SegmentedControl aria-labelledby={currencyLabelId} className='mt-1.25'>
          {options.map(({ code, selected, select }) => (
            <Button
              key={code}
              variant='segment'
              aria-pressed={selected}
              disabled={!data}
              onClick={select}
            >
              {code}
            </Button>
          ))}
        </SegmentedControl>
        <div className='mt-3.75 border-t border-invest-divider pt-2.75'>
          {data ? (
            <output
              htmlFor={inputId}
              aria-label='Результат конвертации'
              className={`block wrap-anywhere ${resultUnavailable ? "text-invest-block text-invest-warning" : "text-invest-section lg:text-invest-metric"}`}
            >
              {result}
            </output>
          ) : (
            <Skeleton className='mt-0.75 h-6.25 w-42.75 rounded-[5px]!' />
          )}
        </div>
      </Form>
    </section>
  );
};
