import type { CatalogCoin } from "@/shared/api/requests";
import { formatQuantity, formatUnitPrice } from "@/shared/helpers";

import { getPurchaseKeys } from "../helpers";
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
  const keys = getPurchaseKeys(purchases);

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
          key: keys[index],
          quantity: formatQuantity(purchase.quantity),
          unitPrice: formatUnitPrice(purchase.unitPrice, purchase.currency)
        };
      })
      .reverse()
  };
};
