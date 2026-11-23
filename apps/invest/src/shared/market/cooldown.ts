import { marketError } from "./helpers.ts";

export const createMarketCooldown = () => {
  let until = 0;
  let channel: BroadcastChannel | undefined;
  try {
    channel = new BroadcastChannel("invest:market-cooldown");
    channel.onmessage = ({ data }: MessageEvent<unknown>) => {
      if (typeof data === "number" && Number.isFinite(data)) {
        until = Math.max(until, data);
      }
    };
  } catch {
    // Local cooldown still applies if the browser blocks BroadcastChannel.
  }

  const record = (retryAt: number | undefined) => {
    if (retryAt === undefined || retryAt <= Math.max(Date.now(), until)) return;
    until = retryAt;
    try {
      channel?.postMessage(until);
    } catch {
      // The request still reports the original rate limit.
    }
  };

  const check = () => {
    if (Date.now() < until) throw marketError("rate-limit", { status: 429, retryAt: until });
  };

  return { record, check };
};
