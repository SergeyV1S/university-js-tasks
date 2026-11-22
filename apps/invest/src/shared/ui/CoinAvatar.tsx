import type { Coin } from "../api/type";
import bitcoinMark from "../assets/bitcoin.svg";
import { useCoinAvatar } from "../hooks/useCoinAvatar";
import { ApiText } from "./ApiText";

type CoinAvatarProps = {
  coin: Pick<Coin, "id" | "name" | "symbol" | "image">;
  size?: "small" | "large";
};

const sizes = {
  small: "size-7.25 text-invest-body font-bold lg:size-8.5 lg:text-lg",
  large: "size-10.5 text-invest-section lg:size-13.5"
};

export const CoinAvatar = ({ coin, size = "small" }: CoinAvatarProps) => {
  const { symbol, image, fallback, handleImageError } = useCoinAvatar(coin);
  const avatarClass = `grid shrink-0 place-items-center overflow-hidden rounded-full ${sizes[size]}`;

  if (symbol) {
    const [backgroundColor, color, character] = symbol;
    return (
      <span aria-hidden='true' className={avatarClass} style={{ backgroundColor, color }}>
        {coin.id === "bitcoin" && size === "large" ? (
          <img src={bitcoinMark} alt='' className='h-5.25 w-3' />
        ) : (
          character
        )}
      </span>
    );
  }
  if (coin.id === "ethereum") {
    return (
      <span aria-hidden='true' className={`${avatarClass} bg-[#161a32]`}>
        <svg viewBox='0 0 18 24' className='h-7/10' fill='#9daeff'>
          <path d='m9 0 9 14-9 4.4L0 14ZM0 16.5 9 21l9-4.5L9 24Z' />
        </svg>
      </span>
    );
  }
  if (coin.id === "solana") {
    return (
      <span aria-hidden='true' className={`${avatarClass} bg-[#241c33]`}>
        <svg viewBox='0 0 16 16' className='w-23/50' fill='#bc9ff5'>
          <rect x='0.5' y='1.5' width='15' height='3.4' rx='1.7' transform='rotate(9 8 3.2)' />
          <rect x='0.5' y='6.3' width='15' height='3.4' rx='1.7' transform='rotate(-9 8 8)' />
          <rect x='0.5' y='11.1' width='15' height='3.4' rx='1.7' transform='rotate(9 8 12.8)' />
        </svg>
      </span>
    );
  }
  return (
    <span aria-hidden='true' className={`${avatarClass} bg-invest-raised text-invest-muted`}>
      {image ? (
        <img
          src={image}
          alt=''
          loading='lazy'
          referrerPolicy='no-referrer'
          className='size-full'
          onError={handleImageError}
        />
      ) : (
        <ApiText value={fallback} />
      )}
    </span>
  );
};
