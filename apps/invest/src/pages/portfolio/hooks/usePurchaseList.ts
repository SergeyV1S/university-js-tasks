import type { CatalogCoin } from "@/shared/market/type";
import { formatQuantity, formatUnitPrice } from "@/shared/helpers/format";

import type { Purchase } from "../types";

const records = new Intl.PluralRules("ru");
const recordLabels = { one: "запись", few: "записи", many: "записей" } as const;

export const usePurchaseList = (
  purchases: Purchase[],
  coins: ReadonlyMap<string, CatalogCoin & { image?: string }>
) => {
  const count = purchases.length;
  const plural = records.select(count);
  const label = plural === "one" || plural === "few" ? recordLabels[plural] : recordLabels.many;

  return {
    countLabel: `${count} ${label}`,
    rows: purchases
      .map((purchase, index) => {
        const coin = coins.get(purchase.coinId) ?? {
          id: purchase.coinId,
          name: purchase.coinId
        };
        return {
          coin,
          index,
          quantity: formatQuantity(purchase.quantity),
          unitPrice: formatUnitPrice(purchase.unitPrice, purchase.currency)
        };
      })
      .reverse()
  };
};
