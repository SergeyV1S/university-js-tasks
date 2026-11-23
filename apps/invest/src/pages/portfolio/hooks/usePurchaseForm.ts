import { useId, useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";

import { isRecoverableMarketError } from "@/shared/market/resource";

import { usePortfolioStore } from "../portfolioStore";

const emptyDraft = { coinId: "", quantity: "", unitPrice: "" };

export const usePurchaseForm = (onSaved: () => void) => {
  const id = useId();
  const [draft, setDraft] = useState(emptyDraft);
  const [query, setQuery] = useState("");
  const coins = usePortfolioStore((state) => state.coins);
  const currency = usePortfolioStore((state) => state.currency);
  const errors = usePortfolioStore((state) => state.errors);
  const readFailed = usePortfolioStore((state) => state.readFailed);
  const saveStatus = usePortfolioStore((state) => state.saveStatus);
  const writable = usePortfolioStore((state) => state.writable);
  const autoRetryCoins = usePortfolioStore((state) => isRecoverableMarketError(state.coinsError));
  const loadingCoins = usePortfolioStore((state) => state.loadingCoins);
  const retryCoins = usePortfolioStore((state) => state.retryCoins);
  const saving = saveStatus === "saving";

  const handleQuery = (value: string) => {
    setQuery(value);
    setDraft((current) => ({ ...current, coinId: "" }));
  };

  const handleSelect = (coinId: string) => {
    usePortfolioStore.getState().clearFieldError("coinId");
    setQuery("");
    setDraft((current) => ({ ...current, coinId }));
  };

  const handleQuantityChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    usePortfolioStore.getState().clearFieldError("quantity");
    setDraft((current) => ({ ...current, quantity: value }));
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    usePortfolioStore.getState().clearFieldError("unitPrice");
    setDraft((current) => ({ ...current, unitPrice: value }));
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = await usePortfolioStore.getState().submit(draft);
    if (result !== "saved") return;

    setDraft(emptyDraft);
    setQuery("");
    onSaved();
  };

  const selected = coins?.find((coin) => coin.id === draft.coinId);
  return {
    id,
    draft,
    query,
    coins,
    currency,
    symbol: selected?.symbol,
    errors,
    saving,
    saveStatus,
    fieldsDisabled: readFailed || !writable || saving,
    loadingCoins,
    autoRetryCoins,
    retryCoins,
    handleQuery,
    handleSelect,
    handleQuantityChange,
    handlePriceChange,
    handleSubmit
  };
};
