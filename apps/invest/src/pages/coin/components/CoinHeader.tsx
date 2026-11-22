import type { Coin } from "../../../shared/api/type";
import { ApiText } from "../../../shared/ui/ApiText";
import { CoinAvatar } from "../../../shared/ui/CoinAvatar";
import { Skeleton } from "../../../shared/ui/Skeleton";
import { useCoinHeader } from "../hooks/useCoinHeader";

type CoinHeaderProps = { coin?: Coin };

export const CoinHeader = ({ coin }: CoinHeaderProps) => {
  const { price, change, changeColor } = useCoinHeader(coin);

  return (
    <header className='mt-1.25 flex flex-col gap-4 lg:flex-row lg:justify-between'>
      <div className='flex min-w-0 items-start gap-3 lg:gap-4 lg:pt-2.75'>
        <div className='mt-0.5 shrink-0'>
          {coin ? (
            <CoinAvatar coin={coin} size='large' />
          ) : (
            <Skeleton className='size-10.5 rounded-full! lg:size-13.5' />
          )}
        </div>
        <div className='min-w-0'>
          <div className='flex min-h-10 items-center gap-3.5 lg:min-h-12 lg:gap-5.75'>
            {coin ? (
              <h1 className='min-w-0 wrap-anywhere text-invest-mobile-title lg:text-invest-title'>
                <ApiText value={coin.name} />
              </h1>
            ) : (
              <Skeleton className='h-7 w-26 lg:h-9 lg:w-32' />
            )}
            {coin?.symbol && (
              <span className='flex h-7 min-w-12.5 translate-y-0.75 items-center justify-center rounded-md border border-invest-divider bg-invest-raised px-2 font-invest-numeric text-invest-compact-number text-invest-muted lg:translate-y-0.25'>
                <span className='max-w-16 truncate uppercase'>
                  <ApiText value={coin.symbol} />
                </span>
              </span>
            )}
          </div>
          {coin?.rank != null && (
            <p className='mt-2 hidden text-invest-muted lg:block'>№ {coin.rank} по капитализации</p>
          )}
        </div>
      </div>
      <div className='flex flex-wrap items-baseline gap-x-6.5 lg:shrink-0 lg:flex-col lg:items-end'>
        <p className='sr-only text-invest-label text-invest-muted lg:not-sr-only'>Текущая цена</p>
        <div className='flex min-h-9.75 items-center lg:mt-0.5 lg:min-h-12.75'>
          {coin ? (
            <p className='text-invest-metric lg:text-invest-total'>{price}</p>
          ) : (
            <Skeleton className='h-7 w-39 lg:h-9 lg:w-51' />
          )}
        </div>
        <div className='-translate-y-1 text-invest-caption lg:mt-1 lg:min-h-4.75 lg:translate-y-0 lg:text-invest-label'>
          {change && <p className={changeColor}>{change} за 24 ч</p>}
        </div>
      </div>
    </header>
  );
};
