import type { SaveStatus } from "../types";

export const getPurchaseFormPlacement = (
  readFailed: boolean,
  hasPurchases: boolean,
  mobileAdd: boolean
) => {
  if (readFailed) return "";
  if (!hasPurchases) return "lg:col-start-2 lg:row-start-1";
  return `lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mt-0 ${mobileAdd ? "" : "mt-4.25"}`;
};

export const getNextOptionIndex = (key: "ArrowDown" | "ArrowUp", index: number, count: number) => {
  if (key === "ArrowDown") return Math.min(index + 1, count - 1);
  if (index === -1) return count - 1;
  return Math.max(0, index - 1);
};

const purchaseNotices: Partial<Record<SaveStatus, { title: string; detail: string }>> = {
  "rate-error": {
    title: "Курс USD/RUB недоступен",
    detail: "Повторите сохранение чуть позже."
  },
  "write-error": {
    title: "Не удалось сохранить покупку",
    detail: "Проверьте хранилище и повторите."
  },
  conflict: {
    title: "Портфель изменился в другой вкладке",
    detail: "Повторите сохранение этой покупки."
  }
};

export const getPurchaseNotice = (status: SaveStatus) => purchaseNotices[status];
