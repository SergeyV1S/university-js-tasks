export { DEFAULT_SETTINGS, DURATIONS, WORD_COUNTS } from "./constants";
export { getResults } from "./helpers/results";
export { getCharacterStatus, hasWordError } from "./helpers/text";
export { createTest, testReducer } from "./model/testReducer";
export type { TestMode, TestSettings, TestState, WordInput } from "./types";
