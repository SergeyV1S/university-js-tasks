import { useCallback } from "react";
import type { RefCallback } from "react";

type InfinityScrollOptions = {
  enabled: boolean;
  onLoadMore?: () => void;
};

export const useInfinityScroll = ({ enabled, onLoadMore }: InfinityScrollOptions) => {
  const loadMore: RefCallback<HTMLElement> = (node) => {
    if (!node || !enabled || !onLoadMore) return;

    let observing = true;
    const observer = new IntersectionObserver((entries) => {
      if (!observing || !entries.some(({ isIntersecting }) => isIntersecting)) return;
      disconnect();
      onLoadMore();
    });
    const disconnect = () => {
      observing = false;
      observer.disconnect();
    };

    observer.observe(node);
    return disconnect;
  };

  return useCallback(loadMore, [enabled, onLoadMore]);
};
