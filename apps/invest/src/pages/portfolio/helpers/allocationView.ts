import type { Valuation } from "../types";

export const getAllocationView = (valuation: Valuation, loading: boolean) => {
  if (valuation.kind === "empty") return "hidden";
  if (loading) return "loading";
  if (valuation.kind === "missing") return "missing";
  return valuation.allocations.length === 0 ? "zero" : "ready";
};
