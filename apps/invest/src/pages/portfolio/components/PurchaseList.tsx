import type { Coin } from "../../../shared/api/type";
import { ApiText } from "../../../shared/ui/ApiText";
import { CoinAvatar } from "../../../shared/ui/CoinAvatar";
import { usePurchaseList } from "../hooks/usePurchaseList";
import type { Purchase } from "../types";

type PurchaseListProps = {
  purchases: Purchase[];
  coins: Coin[] | null;
};

export const PurchaseList = ({ purchases, coins }: PurchaseListProps) => {
  const { countLabel, rows } = usePurchaseList(purchases, coins);

  return (
    <section
      aria-labelledby='portfolio-purchases'
      className='min-w-0 rounded-xl border border-invest-divider bg-invest-surface px-3.75 pt-3 pb-3.5 lg:px-5.25'
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
            className='flex min-h-13.5 items-center gap-2.25 border-t border-invest-divider py-2'
          >
            <CoinAvatar coin={coin} size='compact' />
            <div className='min-w-0 flex-1'>
              <p className='wrap-anywhere text-invest-label'>
                <ApiText value={coin.name} />
              </p>
              <p className='font-invest-numeric wrap-anywhere text-invest-compact-number text-invest-muted'>
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
            <div className='min-w-0 text-right'>
              <p className='font-invest-numeric wrap-anywhere text-invest-table-number'>
                {unitPrice}
              </p>
              <p className='text-invest-note text-invest-muted'>за монету</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
