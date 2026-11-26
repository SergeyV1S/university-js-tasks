export type PortfolioCurrency = "RUB" | "USD";

export type Purchase = {
  coinId: string;
  quantity: number;
  unitPrice: number;
  currency: PortfolioCurrency;
  rubPerUsd: number;
};

export type PortfolioSnapshot = { revision: number; purchases: Purchase[] };
export type PurchaseDraft = { coinId: string; quantity: string; unitPrice: string };
export type PurchaseErrors = Partial<Record<keyof PurchaseDraft, string>>;
export type SaveStatus = "idle" | "saving" | "saved" | "conflict" | "rate-error" | "write-error";
export type Allocation = { coinId: string; percent: number };
export type Valuation =
  | { kind: "empty" }
  | { kind: "missing"; missingIds: string[] }
  | { kind: "ready"; total: number; costs: number; pnl: number; allocations: Allocation[] };
