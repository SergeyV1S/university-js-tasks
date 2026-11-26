import { useId, useState } from "react";
import type { ChangeEvent, KeyboardEvent, MouseEvent, TransitionEvent } from "react";

import type { Coin } from "@/shared/api/requests";
import { formatCoinLabel } from "@/shared/helpers";

import { getNextOptionIndex } from "../helpers";

export const usePurchaseCoinPicker = (
  id: string,
  error: string | undefined,
  coins: Coin[],
  coinId: string,
  query: string,
  onQuery: (value: string) => void,
  onSelect: (id: string) => void
) => {
  const listId = useId();
  const [list, setList] = useState<{ open: true } | { open: false; closingMatches: Coin[] | null }>(
    { open: false, closingMatches: null }
  );
  const { open } = list;
  const [highlighted, setHighlighted] = useState(-1);
  const selected = coins.find((coin) => coin.id === coinId);
  const coinLabel = selected ? formatCoinLabel(selected) : undefined;
  const selectionId = `${id}-selected`;
  const selectionDescription = coinLabel ? selectionId : undefined;
  const matches = coins.filter((coin) =>
    coin.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  const close = () => {
    if (!open) return;
    setList({ open: false, closingMatches: matches });
    setHighlighted(-1);
  };

  const finishClosing = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      event.target !== event.currentTarget ||
      event.propertyName !== "grid-template-rows" ||
      event.currentTarget.getBoundingClientRect().height !== 0
    )
      return;
    setList((current) =>
      current.open || current.closingMatches === null
        ? current
        : { open: false, closingMatches: null }
    );
  };

  const select = (id: string) => {
    onSelect(id);
    close();
  };

  const handleMouseDown = (event: MouseEvent) => event.preventDefault();
  const show = () => setList((current) => (current.open ? current : { open: true }));
  const search = (value: string) => {
    onQuery(value);
    show();
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
    show();
    if (matches.length === 0) return;
    const index = getNextOptionIndex(event.key, highlighted, matches.length);
    setHighlighted(index);
    requestAnimationFrame(() => {
      const option = document.getElementById(optionId(index));
      if (option && !option.closest("[inert]")) option.scrollIntoView({ block: "nearest" });
    });
  };

  const visibleMatches = list.open ? matches : (list.closingMatches ?? []);
  const options = visibleMatches.map((coin, index) => ({
    coin,
    id: optionId(index),
    active: index === highlighted,
    select: () => select(coin.id)
  }));

  return {
    open,
    listId,
    options,
    noMatches: (list.open || list.closingMatches !== null) && options.length === 0,
    activeId: open && matches[highlighted] ? optionId(highlighted) : undefined,
    coinLabel,
    selectionId,
    descriptionId: error ? `${id}-error` : selectionDescription,
    close,
    finishClosing,
    handleChange,
    show,
    handleKeyDown,
    handleMouseDown
  };
};
