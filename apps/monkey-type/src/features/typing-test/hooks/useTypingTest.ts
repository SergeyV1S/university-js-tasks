import { useEffect, useReducer } from "react";
import { createTest, testReducer, type TestSettings } from "@/entities/test";

export const useTypingTest = () => {
  const [test, dispatch] = useReducer(testReducer, undefined, () => createTest());
  const timedStart =
    test.phase === "running" && test.settings.mode === "time" ? test.startedAt : null;
  const durationMs = test.settings.duration * 1000;

  useEffect(() => {
    if (timedStart === null) return;

    let timer: number | undefined;
    const syncClock = () => {
      window.clearTimeout(timer);
      const now = performance.now();
      dispatch({ type: "tick", now });

      const elapsedMs = now - timedStart;
      if (elapsedMs < durationMs) {
        const untilNextSecond = Math.ceil(1000 - (elapsedMs % 1000));
        timer = window.setTimeout(syncClock, untilNextSecond);
      }
    };

    syncClock();
    document.addEventListener("visibilitychange", syncClock);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", syncClock);
    };
  }, [timedStart, durationMs]);

  return {
    state: {
      test,
      remainingSeconds: Math.max(0, Math.ceil(test.settings.duration - test.elapsedMs / 1000)),
      completedWords: test.inputs.length - 1
    },
    functions: {
      configure: (settings: TestSettings) => dispatch({ type: "configure", settings }),
      start: () => dispatch({ type: "start" }),
      restart: () => dispatch({ type: "restart" }),
      next: () => dispatch({ type: "next" }),
      typeCharacter: (character: string) =>
        dispatch({ type: "type", character, now: performance.now() }),
      backspace: () => dispatch({ type: "backspace", now: performance.now() })
    }
  };
};
