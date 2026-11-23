import { isPositiveNumber } from "../../shared/helpers/positiveNumber";
import type { PortfolioSnapshot, Purchase } from "./types";

const PORTFOLIO_KEY = "invest:portfolio";
const WRITE_LOCK = "invest:portfolio-write";

type AppendResult = { kind: "saved" | "conflict"; snapshot: PortfolioSnapshot };

let portfolioChannel: BroadcastChannel | undefined;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPurchase = (value: unknown): value is Purchase =>
  isRecord(value) &&
  typeof value.coinId === "string" &&
  value.coinId.length > 0 &&
  isPositiveNumber(value.quantity) &&
  isPositiveNumber(value.unitPrice) &&
  (value.currency === "RUB" || value.currency === "USD") &&
  isPositiveNumber(value.rubPerUsd);

export const readPortfolio = (): PortfolioSnapshot => {
  const raw = localStorage.getItem(PORTFOLIO_KEY);
  if (raw === null) return { revision: 0, purchases: [] };

  const parsed = JSON.parse(raw);
  if (
    !isRecord(parsed) ||
    typeof parsed.revision !== "number" ||
    !Number.isSafeInteger(parsed.revision) ||
    parsed.revision < 0 ||
    !Array.isArray(parsed.purchases) ||
    !parsed.purchases.every(isPurchase)
  ) {
    throw new Error("Некорректный снимок портфеля");
  }

  return { revision: parsed.revision, purchases: parsed.purchases };
};

export const canWritePortfolio = () => typeof navigator.locks?.request === "function";

const publishRevision = (revision: number) => {
  try {
    const channel = portfolioChannel ?? new BroadcastChannel(PORTFOLIO_KEY);
    if (!portfolioChannel) setTimeout(() => channel.close(), 0);
    channel.postMessage(revision);
  } catch (error) {
    console.warn("Не удалось отправить ревизию портфеля", error);
  }
};

export const appendPurchase = async (
  purchase: Purchase,
  expectedRevision: number
): Promise<AppendResult> => {
  const result = await navigator.locks.request(
    WRITE_LOCK,
    { mode: "exclusive" },
    (): AppendResult => {
      const current = readPortfolio();
      if (current.revision !== expectedRevision) return { kind: "conflict", snapshot: current };

      const revision = current.revision + 1;
      if (!Number.isSafeInteger(revision)) throw new Error("Недопустимая ревизия портфеля");
      const snapshot = { revision, purchases: [...current.purchases, purchase] };
      localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(snapshot));
      return { kind: "saved", snapshot };
    }
  );

  if (result.kind === "saved") publishRevision(result.snapshot.revision);
  return result;
};

export const subscribePortfolio = (
  onChange: (snapshot: PortfolioSnapshot) => void,
  onError: (error: Error) => void
) => {
  let pendingRevision = 0;

  const refresh = () => {
    try {
      const snapshot = readPortfolio();
      if (snapshot.revision >= pendingRevision) pendingRevision = 0;
      onChange(snapshot);
    } catch (error) {
      onError(error instanceof Error ? error : new Error("Не удалось открыть портфель"));
    }
  };

  const handleVisibility = () => {
    if (document.visibilityState === "visible") refresh();
  };

  const handleMessage = ({ data }: MessageEvent<unknown>) => {
    if (typeof data !== "number" || !Number.isSafeInteger(data) || data < 1) return;
    pendingRevision = Math.max(pendingRevision, data);
    refresh();
  };

  const handleStorage = ({ key }: StorageEvent) => {
    if (key === PORTFOLIO_KEY && pendingRevision > 0) refresh();
  };

  let channel: BroadcastChannel | undefined;
  try {
    channel = new BroadcastChannel(PORTFOLIO_KEY);
    channel.addEventListener("message", handleMessage);
    portfolioChannel = channel;
  } catch (error) {
    console.warn("Не удалось подключить синхронизацию портфеля", error);
  }

  window.addEventListener("focus", refresh);
  window.addEventListener("pageshow", refresh);
  window.addEventListener("storage", handleStorage);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    if (portfolioChannel === channel) portfolioChannel = undefined;
    channel?.close();
    window.removeEventListener("focus", refresh);
    window.removeEventListener("pageshow", refresh);
    window.removeEventListener("storage", handleStorage);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
};
