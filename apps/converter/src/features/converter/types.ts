import type { INPUT_KEYS } from "./constants";

export type InputKey = (typeof INPUT_KEYS)[number];

export type KeypadKey = InputKey | "clear" | "backspace";
