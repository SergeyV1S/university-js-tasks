import { marketError } from "../../../../market/index.ts";

import type { CatalogCoin } from "../types.ts";

export const readCoinIdentity = ({ id, name, symbol }: Record<string, unknown>): CatalogCoin => {
  if (typeof id !== "string" || id.length === 0 || typeof name !== "string" || name.length === 0) {
    throw marketError("invalid-response");
  }
  return typeof symbol === "string" && symbol ? { id, name, symbol } : { id, name };
};
