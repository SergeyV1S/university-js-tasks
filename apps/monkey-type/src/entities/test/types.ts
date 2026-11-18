export type TestMode = "time" | "words";
export type TestPhase = "setup" | "ready" | "running" | "finished";

export type TestSettings = {
  mode: TestMode;
  wordCount: number;
  duration: number;
};

export type WordInput = {
  text: string;
  extraSpaces: number;
};

export type TestState = {
  settings: TestSettings;
  phase: TestPhase;
  passage: number;
  words: string[];
  inputs: WordInput[];
  startedAt: number | null;
  elapsedMs: number;
  keystrokes: number;
  correctKeystrokes: number;
};

export type TestAction =
  | { type: "configure"; settings: TestSettings }
  | { type: "start" }
  | { type: "restart" }
  | { type: "next" }
  | { type: "type"; character: string; now: number }
  | { type: "backspace"; now: number }
  | { type: "tick"; now: number };

export type CharacterStatus = "pending" | "correct" | "incorrect" | "extra";
