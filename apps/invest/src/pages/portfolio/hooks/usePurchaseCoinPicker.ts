import { useId, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent } from "react";

import type { Coin } from "../../../shared/api/type";

export const usePurchaseCoinPicker = (
  coins: Coin[],
  coinId: string,
  query: string,
  onQuery: (value: string) => void,
  onSelect: (id: string) => void
) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const selected = coins.find((coin) => coin.id === coinId);
  const coinLabel = selected?.symbol
    ? `${selected.name} (${selected.symbol.toUpperCase()})`
    : selected?.name;
  const matches = coins.filter((coin) =>
    coin.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const close = () => {
    setOpen(false);
    setHighlighted(-1);
  };

  const select = (id: string) => {
    onSelect(id);
    close();
  };

  const handleMouseDown = (event: MouseEvent) => event.preventDefault();
  const handleClick = () => setOpen(true);
  const search = (value: string) => {
    onQuery(value);
    setOpen(true);
    setHighlighted(-1);
  };
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => search(event.target.value);

  const optionId = (index: number) => `${listId}-${index}`;
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Backspace" && selected) {
      event.preventDefault();
      search("");
    }
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close();
    }
    if (event.key === "Enter" && open && matches[highlighted]) {
      event.preventDefault();
      select(matches[highlighted].id);
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

    event.preventDefault();
    setOpen(true);
    if (matches.length === 0) return;
    const index =
      event.key === "ArrowDown"
        ? Math.min(highlighted + 1, matches.length - 1)
        : highlighted === -1
          ? matches.length - 1
          : Math.max(0, highlighted - 1);
    setHighlighted(index);
    requestAnimationFrame(() =>
      document.getElementById(optionId(index))?.scrollIntoView({ block: "nearest" })
    );
  };

  const options = open
    ? matches.map((coin, index) => ({
        coin,
        id: optionId(index),
        active: index === highlighted,
        select: () => select(coin.id)
      }))
    : [];

  return {
    open,
    listId,
    options,
    activeId: open && matches[highlighted] ? optionId(highlighted) : undefined,
    coinLabel,
    close,
    handleChange,
    handleClick,
    handleKeyDown,
    handleMouseDown
  };
};
