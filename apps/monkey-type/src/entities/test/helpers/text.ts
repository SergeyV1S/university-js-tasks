import { PASSAGES } from "../constants.ts";
import type { CharacterStatus, WordInput } from "../types";

const passageWords = PASSAGES.map((passage) => passage.split(/\s+/));

export const createWords = (count: number, passage: number, offset = 0): string[] => {
  const firstPassage = passage % passageWords.length;
  const words = [
    ...passageWords.slice(firstPassage),
    ...passageWords.slice(0, firstPassage)
  ].flat();
  return Array.from({ length: count }, (_, index) => words[(offset + index) % words.length]);
};

export const getCharacterStatus = (
  expected: string,
  input: WordInput | undefined,
  index: number,
  completed: boolean
): CharacterStatus => {
  if (!input || index >= input.text.length) return completed ? "incorrect" : "pending";
  if (index >= expected.length) return "extra";
  return input.text[index] === expected[index] ? "correct" : "incorrect";
};

export const hasWordError = (expected: string, input: WordInput | undefined, completed: boolean) =>
  !!input &&
  (input.extraSpaces > 0 ||
    (completed ? input.text !== expected : !expected.startsWith(input.text)));
