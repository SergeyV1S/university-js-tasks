import type { KeypadKey } from "../types";

const KEYBOARD_KEYS: Partial<Record<string, KeypadKey>> = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  ",": ",",
  ".": ",",
  Backspace: "backspace",
  Delete: "clear",
  Escape: "clear"
};

export const toKeypadKey = (event: KeyboardEvent) =>
  event.ctrlKey || event.metaKey || event.altKey ? undefined : KEYBOARD_KEYS[event.key];
