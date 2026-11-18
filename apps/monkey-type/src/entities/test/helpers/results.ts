import type { TestState } from "../types";

export const getResults = (state: TestState) => ({
  cpm: state.elapsedMs > 0 ? Math.round((state.correctKeystrokes * 60_000) / state.elapsedMs) : 0,
  accuracy:
    state.keystrokes > 0 ? Math.round((state.correctKeystrokes / state.keystrokes) * 100) : 0,
  characters: state.keystrokes,
  errors: state.keystrokes - state.correctKeystrokes
});
