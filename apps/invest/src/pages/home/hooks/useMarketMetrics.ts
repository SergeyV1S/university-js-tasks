import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import { formatPercent } from "@/shared/helpers/format";
import { percentColor } from "@/shared/helpers/percentColor";

import type { HomeInitialData } from "../api";
import { buildCards } from "../helpers/buildCards";

export const useMarketMetrics = (metrics: HomeInitialData["metrics"]["data"]) => {
  const [open, setOpen] = useState<{ index: number; pinned: boolean } | null>(null);
  const activeCard = useRef<HTMLElement | null>(null);
  const activeHelp = useRef<HTMLButtonElement | null>(null);

  const openIndex = open?.index;
  useEffect(() => {
    if (openIndex === undefined) return;

    const dismissOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !activeCard.current?.contains(event.target))
        setOpen(null);
    };

    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(null);
      if (activeCard.current?.contains(document.activeElement)) activeHelp.current?.focus();
    };

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [openIndex]);

  const closeExplanation = () => {
    activeHelp.current?.focus();
    setOpen(null);
  };

  const cards = buildCards(metrics).map(({ title, description, value, change }, index) => {
    const handlePointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "mouse") return;
      setOpen((current) => (current?.index === index && !current.pinned ? null : current));
    };

    const handlePointerEnter = (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.pointerType !== "mouse") return;
      setOpen((current) => (current?.pinned ? current : { index, pinned: false }));
    };

    const toggleExplanation = () => {
      setOpen((current) =>
        current?.index === index && current.pinned ? null : { index, pinned: true }
      );
    };

    return {
      title,
      description,
      value: value || "—",
      change:
        change == null
          ? null
          : { label: `${formatPercent(change, true)} за 24 ч`, color: percentColor(change) },
      visible: openIndex === index,
      explanationId: `market-metric-${index}`,
      handlePointerLeave,
      handlePointerEnter,
      toggleExplanation
    };
  });

  return { cards, activeCard, activeHelp, closeExplanation };
};
