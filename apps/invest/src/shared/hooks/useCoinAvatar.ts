import { useState } from "react";

import type { Coin } from "@/shared/api/requests";

const symbols = new Map<string, readonly [string, string, string]>([
  ["bitcoin", ["#19130e", "#f9a33e", "₿"]],
  ["tether", ["#12312a", "#79d5bd", "₮"]],
  ["binancecoin", ["#292418", "#ebcf67", "B"]],
  ["usd-coin", ["#1a2740", "#9abfff", "$"]],
  ["ripple", ["#28313a", "#d4dcea", "X"]],
  ["dogecoin", ["#312b1e", "#ebca91", "Ð"]],
  ["the-open-network", ["#1a2b38", "#83d5fb", "T"]],
  ["cardano", ["#212940", "#aabafe", "A"]]
]);

export const useCoinAvatar = (coin: Pick<Coin, "id" | "name" | "symbol" | "image">) => {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const symbol = symbols.get(coin.id);
  const image = coin.image !== failedImage ? coin.image : null;
  const fallback =
    image || symbol ? "" : (Array.from(coin.symbol ?? coin.name)[0]?.toUpperCase() ?? "");
  const handleImageError = () => setFailedImage(coin.image ?? null);

  return { symbol, image, fallback, handleImageError };
};
