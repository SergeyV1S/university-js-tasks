import { DEFAULT_SETTINGS, TIMED_WORD_BATCH_SIZE } from "../constants.ts";
import { createWords } from "../helpers/text.ts";
import type { TestAction, TestSettings, TestState, WordInput } from "../types";

const emptyInput = (): WordInput => ({ text: "", extraSpaces: 0 });

const createProgress = () => ({
  inputs: [emptyInput()],
  startedAt: null,
  elapsedMs: 0,
  keystrokes: 0,
  correctKeystrokes: 0
});

export const createTest = (
  settings: TestSettings = DEFAULT_SETTINGS,
  passage = 0,
  phase: TestState["phase"] = "setup"
): TestState => ({
  settings,
  passage,
  phase,
  words: createWords(
    settings.mode === "words" ? settings.wordCount : TIMED_WORD_BATCH_SIZE,
    passage
  ),
  ...createProgress()
});

const advanceClock = (state: TestState, now: number): TestState => {
  if (state.phase !== "running" || state.startedAt === null) return state;
  const elapsedMs = Math.max(0, now - state.startedAt);
  const durationMs = state.settings.duration * 1000;
  if (state.settings.mode === "time" && elapsedMs >= durationMs) {
    return { ...state, elapsedMs: durationMs, phase: "finished" };
  }
  return elapsedMs === state.elapsedMs ? state : { ...state, elapsedMs };
};

const replaceCurrentInput = (inputs: WordInput[], input: WordInput) => [
  ...inputs.slice(0, -1),
  input
];

const typeCharacter = (state: TestState, character: string, now: number): TestState => {
  if (character.length !== 1 || /[\r\n\t]/.test(character)) return state;

  const index = state.inputs.length - 1;
  const input = state.inputs[index];
  const expected = state.words[index];
  const isSpace = character === " ";
  const completesWord = isSpace && input.text.length > 0;
  const correct = isSpace
    ? completesWord && input.text.length >= expected.length
    : character === expected[input.text.length];
  const atEnd = index === state.words.length - 1;
  const filledWord = !isSpace && input.text.length + 1 === expected.length;
  const finished = atEnd && state.settings.mode === "words" && (completesWord || filledWord);

  let inputs = state.inputs;
  if (!completesWord) {
    const updated = isSpace
      ? { ...input, extraSpaces: input.extraSpaces + 1 }
      : { ...input, text: input.text + character };
    inputs = replaceCurrentInput(inputs, updated);
  } else if (!finished) {
    inputs = [...inputs, emptyInput()];
  }

  return {
    ...state,
    phase: finished ? "finished" : "running",
    startedAt: state.startedAt ?? now,
    inputs,
    words:
      completesWord && atEnd && !finished
        ? [...state.words, ...createWords(TIMED_WORD_BATCH_SIZE, state.passage, state.words.length)]
        : state.words,
    keystrokes: state.keystrokes + 1,
    correctKeystrokes: state.correctKeystrokes + Number(correct)
  };
};

const backspace = (state: TestState): TestState => {
  const input = state.inputs.at(-1)!;
  if (input.text.length > 0) {
    return {
      ...state,
      inputs: replaceCurrentInput(state.inputs, { ...input, text: input.text.slice(0, -1) })
    };
  }
  if (input.extraSpaces > 0) {
    return {
      ...state,
      inputs: replaceCurrentInput(state.inputs, { ...input, extraSpaces: input.extraSpaces - 1 })
    };
  }
  return state.inputs.length > 1 ? { ...state, inputs: state.inputs.slice(0, -1) } : state;
};

export const testReducer = (state: TestState, action: TestAction): TestState => {
  switch (action.type) {
    case "configure":
      return createTest(
        action.settings,
        state.passage,
        state.phase === "setup" ? "setup" : "ready"
      );
    case "start":
      return state.phase === "setup" ? { ...state, phase: "ready" } : state;
    case "restart":
      return { ...state, ...createProgress(), phase: "ready" };
    case "next":
      return createTest(state.settings, state.passage + 1, "ready");
    case "tick":
      return state.settings.mode === "time" ? advanceClock(state, action.now) : state;
    case "type":
    case "backspace": {
      const current = advanceClock(state, action.now);
      if (current.phase !== "ready" && current.phase !== "running") return current;
      return action.type === "type"
        ? typeCharacter(current, action.character, action.now)
        : backspace(current);
    }
  }
};
