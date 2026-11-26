import type { Purchase } from "../types";

export const getPurchaseKeys = (purchases: readonly Purchase[]) => {
  const occurrences = new Map<string, number>();

  // Stored purchases can have identical values and do not have their own IDs.
  return purchases.map(({ coinId, quantity, unitPrice, currency, rubPerUsd }) => {
    const signature = JSON.stringify([coinId, quantity, unitPrice, currency, rubPerUsd]);
    const occurrence = (occurrences.get(signature) ?? 0) + 1;
    occurrences.set(signature, occurrence);
    return `${signature}:${occurrence}`;
  });
};
