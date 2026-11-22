import { useState } from "react";

import type { Coin } from "../../../shared/api/client";
import { ApiText } from "../../../shared/ui/ApiText";

const symbols = new Map([
  ["bitcoin", ["#19130e", "#f9a33e", "₿"]],
  ["tether", ["#12312a", "#79d5bd", "₮"]],
  ["binancecoin", ["#292418", "#ebcf67", "B"]],
  ["usd-coin", ["#1a2740", "#9abfff", "$"]],
  ["ripple", ["#28313a", "#d4dcea", "X"]],
  ["dogecoin", ["#312b1e", "#ebca91", "Ð"]],
  ["the-open-network", ["#1a2b38", "#83d5fb", "T"]],
  ["cardano", ["#212940", "#aabafe", "A"]],
]);

export const CoinAvatar = ({ coin }: { coin: Coin }) => {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const className = "grid size-[29px] shrink-0 place-items-center overflow-hidden rounded-full text-[15px] font-bold lg:size-[34px] lg:text-lg";
  const symbol = symbols.get(coin.id);

  if (symbol) {
    const [backgroundColor, color, character] = symbol;
    return <span aria-hidden="true" className={className} style={{ backgroundColor, color }}>{character}</span>;
  }
  if (coin.id === "ethereum") {
    return (
      <span aria-hidden="true" className={`${className} bg-[#161a32]`}>
        <svg viewBox="0 0 18 24" className="h-[70%]" fill="#9daeff">
          <path d="m9 0 9 14-9 4.4L0 14ZM0 16.5 9 21l9-4.5L9 24Z" />
        </svg>
      </span>
    );
  }
  if (coin.id === "solana") {
    return (
      <span aria-hidden="true" className={`${className} bg-[#241c33]`}>
        <svg viewBox="0 0 16 16" className="w-[46%]" fill="#bc9ff5">
          <rect x="0.5" y="1.5" width="15" height="3.4" rx="1.7" transform="rotate(9 8 3.2)" />
          <rect x="0.5" y="6.3" width="15" height="3.4" rx="1.7" transform="rotate(-9 8 8)" />
          <rect x="0.5" y="11.1" width="15" height="3.4" rx="1.7" transform="rotate(9 8 12.8)" />
        </svg>
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`${className} bg-invest-raised text-invest-muted`}>
      {coin.image && coin.image !== failedImage
        ? <img src={coin.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full" onError={() => setFailedImage(coin.image ?? null)} />
        : <ApiText value={Array.from(coin.symbol ?? coin.name)[0]?.toUpperCase() ?? ""} />}
    </span>
  );
};
