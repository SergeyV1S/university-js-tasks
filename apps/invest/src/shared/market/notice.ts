import { isRecoverableMarketError } from "./resource";
import type { MarketError } from "./type";

const secondsFormat = new Intl.NumberFormat("ru", {
  style: "unit",
  unit: "second",
  unitDisplay: "long"
});

export const marketNotice = (
  error: MarketError,
  title: string,
  stale = false,
  staleDetail = "Повторим запрос автоматически."
) => {
  if (error.kind === "rate-limit") {
    const seconds = Math.max(1, Math.ceil(((error.retryAt ?? 0) - Date.now()) / 1_000));
    return {
      title: "Лимит запросов к сервису",
      detail:
        error.retryAt && error.retryAt > Date.now()
          ? `Следующая попытка через ${secondsFormat.format(seconds)}.`
          : "Повторим запрос автоматически."
    };
  }
  return {
    title: error.kind === "network" && stale ? "Нет подключения" : title,
    detail: isRecoverableMarketError(error)
      ? stale
        ? staleDetail
        : "Повторим запрос автоматически."
      : undefined
  };
};

export const selectMarketError = (...errors: (MarketError | null | undefined)[]) =>
  errors.find((error) => error?.kind === "rate-limit") ??
  errors.find((error) => error?.kind === "network") ??
  errors.find((error) => error != null);
