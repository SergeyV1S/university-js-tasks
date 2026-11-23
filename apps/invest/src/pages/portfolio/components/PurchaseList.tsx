import type { CatalogCoin } from "@/shared/api/type";
import { ApiText } from "@/shared/ui/ApiText";
import { CoinAvatar } from "@/shared/ui/CoinAvatar";

import { usePurchaseList } from "../hooks/usePurchaseList";
import type { Purchase } from "../types";

type PurchaseListProps = {
  purchases: Purchase[];
  coins: ReadonlyMap<string, CatalogCoin & { image?: string }>;
};

export const PurchaseList = ({ purchases, coins }: PurchaseListProps) => {
  const { countLabel, rows } = usePurchaseList(purchases, coins);

  return (
    <section
      aria-labelledby='portfolio-purchases'
      className='min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-3.25 pt-3 pb-3.75 lg:px-5.25'
    >
      <div className='flex items-center justify-between gap-2 pb-2.5'>
        <h2 id='portfolio-purchases' className='text-invest-block'>
          Покупки
        </h2>
        <p className='text-invest-caption text-invest-muted'>{countLabel}</p>
      </div>
      <ul role='list'>
        {rows.map(({ coin, index, quantity, unitPrice }) => (
          <li
            key={index}
            className='flex min-h-13.5 items-start gap-2.25 border-t border-invest-divider pt-1.5 pb-2 first:min-h-14.25 first:pt-2.25'
          >
            <div className='mt-1 shrink-0'>
              <CoinAvatar coin={coin} size='base' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='wrap-anywhere text-invest-label'>
                <ApiText value={coin.name} />
              </p>
              <p className='mt-0.5 font-invest-numeric wrap-anywhere text-invest-compact-number text-invest-muted'>
                {quantity}
                {coin.symbol && (
                  <>
                    {" "}
                    <span className='uppercase'>
                      <ApiText value={coin.symbol} />
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className='min-w-0 pr-0.5 text-right'>
              <p className='font-invest-numeric wrap-anywhere text-invest-table-number'>
                {unitPrice}
              </p>
              <p className='mt-0.25 text-invest-note text-invest-muted'>за монету</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
