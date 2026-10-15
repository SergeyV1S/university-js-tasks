import { useEffect, useEffectEvent } from "react";

export const usePageLeave = (onLeave: () => void) => {
  const handleLeave = useEffectEvent(onLeave);

  useEffect(() => {
    const handlePageHide = () => {
      handleLeave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") handleLeave();
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
};
