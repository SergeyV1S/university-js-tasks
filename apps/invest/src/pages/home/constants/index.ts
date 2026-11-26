import type { PriceRange } from "../helpers";

export const coinCount = new Intl.NumberFormat("ru");
export const plural = new Intl.PluralRules("ru");

export const countNoun: Partial<Record<Intl.LDMLPluralRule, string>> = {
  one: "монета",
  few: "монеты",
  many: "монет"
};

export const sortLabels = {
  rank: "По рангу",
  name: "По названию",
  price: "По цене",
  change24h: "По изменению за 24 ч",
  marketCap: "По капитализации"
};

export const emptyRange: PriceRange = { min: null, max: null };
export const LAST_TOP_PAGE = 5;
