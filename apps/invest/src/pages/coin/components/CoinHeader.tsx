import type { Coin } from "@/shared/api/requests";
import { ApiText, CoinAvatar, Skeleton } from "@/shared/ui";

import { useCoinHeader } from "../hooks";

type CoinHeaderProps = { coin?: Coin };

export const CoinHeader = ({ coin }: CoinHeaderProps) => {
  const { price, change, changeColor } = useCoinHeader(coin);

  return (
    <header
      className='invest-intro invest-feature-panel mt-2 flex flex-col gap-4 rounded-xl border border-invest-divider p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:p-7'
      data-ready={Boolean(coin)}
      data-enter
    >
      <div className='flex min-w-0 items-center gap-3 lg:gap-4'>
        <div className='mt-0.5 shrink-0'>
          {coin ? (
            <CoinAvatar coin={coin} size='large' />
          ) : (
            <Skeleton className='size-10.5 rounded-full! lg:size-13.5' />
          )}
        </div>
        <div className='min-w-0'>
          <div className='flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 lg:min-h-12 lg:gap-x-5'>
            {coin ? (
              <h1 className='min-w-0 wrap-anywhere text-invest-mobile-title lg:text-invest-title'>
                <ApiText value={coin.name} />
              </h1>
            ) : (
              <Skeleton className='h-7 w-26 lg:h-9 lg:w-32' />
            )}
            {coin?.symbol && (
              <span className='flex h-7 shrink-0 items-center justify-center rounded-md border border-invest-divider bg-invest-background px-2 font-invest-numeric text-invest-compact-number text-invest-muted'>
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
      <div className='flex min-w-0 flex-wrap items-baseline gap-x-4 border-t border-invest-divider pt-3 lg:max-w-1/2 lg:flex-col lg:items-end lg:justify-self-end lg:border-t-0 lg:pt-0 lg:text-right'>
        <p className='w-full text-invest-label text-invest-muted'>Текущая цена</p>
        <div className='flex min-h-9.75 items-center lg:mt-0.5 lg:min-h-12.75'>
          {coin ? (
            <p className='wrap-anywhere text-invest-metric lg:text-invest-total'>{price}</p>
          ) : (
            <Skeleton className='h-7 w-39 lg:h-9 lg:w-51' />
          )}
        </div>
        <div className='text-invest-caption lg:mt-1 lg:min-h-4.75 lg:text-invest-label'>
          {change && <p className={changeColor}>{change} за 24 ч</p>}
        </div>
      </div>
    </header>
  );
};
