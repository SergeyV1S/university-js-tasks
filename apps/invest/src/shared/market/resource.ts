import { isMarketError, marketError } from "./helpers.ts";
import type { MarketError } from "./type.ts";

export type MarketResult<T> = { data: T; error: null } | { data: null; error: MarketError };

export type MarketState<T> = {
  status: "initial" | "refreshing" | "ready" | "unavailable" | "stale";
  data: T | null;
  error: MarketError | null;
};

export const isRecoverableMarketError = (error: MarketError | null | undefined) =>
  error?.kind === "network" || error?.kind === "rate-limit";

export const readMarket = async <T>(
  signal: AbortSignal,
  load: () => Promise<T>
): Promise<MarketResult<T>> => {
  try {
    const data = await load();
    signal.throwIfAborted();
    return { data, error: null };
  } catch (error) {
    signal.throwIfAborted();
    return { data: null, error: isMarketError(error) ? error : marketError("invalid-response") };
  }
};

type ResourceOptions<T> = {
  load: (signal: AbortSignal) => Promise<T>;
  onState: (state: MarketState<T>) => void;
  retainOnFailure: boolean;
  initial?: MarketResult<T>;
  previous?: T | null;
};

export const createMarketResource = <T>({
  load,
  onState,
  retainOnFailure,
  initial,
  previous = null
}: ResourceOptions<T>) => {
  let controller: AbortController | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let delay = 2_000;
  let state: MarketState<T> = {
    status: previous === null ? "initial" : "ready",
    data: previous,
    error: null
  };

  const scheduleRetry = (error: MarketError) => {
    if (!isRecoverableMarketError(error)) return;

    const retryAt = Math.max(Date.now() + delay, error.retryAt ?? 0);
    delay = Math.min(delay * 2, 60_000);
    const retry = () => {
      timer = undefined;
      if (Date.now() < retryAt) {
        wait();
        return;
      }
      run();
    };
    const wait = () => {
      timer = setTimeout(retry, Math.min(retryAt - Date.now(), 2_147_483_647));
    };
    wait();
  };

  const settle = (result: MarketResult<T>) => {
    if (result.error) {
      const data = retainOnFailure ? state.data : null;
      state = { status: data === null ? "unavailable" : "stale", data, error: result.error };
      scheduleRetry(result.error);
    } else {
      delay = 2_000;
      state = { status: "ready", ...result };
    }
    onState(state);
  };

  const run = async () => {
    if (controller || timer !== undefined) return;

    const request = new AbortController();
    controller = request;
    const { signal } = request;
    state = { ...state, status: state.status === "initial" ? "initial" : "refreshing" };
    onState(state);

    try {
      const result = await readMarket(signal, () => load(signal));
      if (!signal.aborted) settle(result);
    } catch (error) {
      if (!signal.aborted) throw error;
    } finally {
      if (controller === request) controller = undefined;
    }
  };

  const stop = () => {
    if (timer) clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
  };

  if (initial) settle(initial);

  return { run, stop };
};
