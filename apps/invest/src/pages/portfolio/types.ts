import type { Coin } from "@/shared/api/type";

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
export type PortfolioInitialData = { snapshot: PortfolioSnapshot | null; coins: Coin[] | null };
