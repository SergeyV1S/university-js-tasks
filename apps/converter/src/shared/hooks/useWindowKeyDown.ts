import { useEffect, useEffectEvent } from "react";

export const useWindowKeyDown = (onKeyDown: (event: KeyboardEvent) => void, isEnabled = true) => {
  const handleKeyDown = useEffectEvent(onKeyDown);

  useEffect(() => {
    if (!isEnabled) return;

    const listener = (event: KeyboardEvent) => handleKeyDown(event);
    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [isEnabled]);
};
