import type { Coin } from "../../../shared/api/client";
import { ApiText } from "../../../shared/ui/ApiText";
import { useCoinAvatar } from "../hooks/useCoinAvatar";

const avatarClass = "grid size-7.25 shrink-0 place-items-center overflow-hidden rounded-full text-[15px] font-bold lg:size-8.5 lg:text-lg";

export const CoinAvatar = ({ coin }: { coin: Coin }) => {
  const { symbol, image, fallback, handleImageError } = useCoinAvatar(coin);

  if (symbol) {
    const [backgroundColor, color, character] = symbol;
    return <span aria-hidden="true" className={avatarClass} style={{ backgroundColor, color }}>{character}</span>;
  }
  if (coin.id === "ethereum") {
    return (
      <span aria-hidden="true" className={`${avatarClass} bg-[#161a32]`}>
        <svg viewBox="0 0 18 24" className="h-7/10" fill="#9daeff">
          <path d="m9 0 9 14-9 4.4L0 14ZM0 16.5 9 21l9-4.5L9 24Z" />
        </svg>
      </span>
    );
  }
  if (coin.id === "solana") {
    return (
      <span aria-hidden="true" className={`${avatarClass} bg-[#241c33]`}>
        <svg viewBox="0 0 16 16" className="w-23/50" fill="#bc9ff5">
          <rect x="0.5" y="1.5" width="15" height="3.4" rx="1.7" transform="rotate(9 8 3.2)" />
          <rect x="0.5" y="6.3" width="15" height="3.4" rx="1.7" transform="rotate(-9 8 8)" />
          <rect x="0.5" y="11.1" width="15" height="3.4" rx="1.7" transform="rotate(9 8 12.8)" />
        </svg>
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`${avatarClass} bg-invest-raised text-invest-muted`}>
      {image
        ? <img src={image} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-full" onError={handleImageError} />
        : <ApiText value={fallback} />}
    </span>
  );
};
