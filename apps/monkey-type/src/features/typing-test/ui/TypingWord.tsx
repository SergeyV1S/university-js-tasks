import { memo } from "react";
import { getCharacterStatus, hasWordError, type WordInput } from "@/entities/test";

type TypingWordProps = {
  word: string;
  input: WordInput | undefined;
  completed: boolean;
  active: boolean;
};

export const TypingWord = memo(({ word, input, completed, active }: TypingWordProps) => {
  const length = Math.max(word.length, input?.text.length ?? 0);
  const cursor = input?.text.length ?? 0;
  const hasError = hasWordError(word, input, completed);

  return (
    <span className={`typing-word${hasError ? " typing-word--error" : ""}`}>
      {Array.from({ length: input?.extraSpaces ?? 0 }, (_, index) => (
        <span key={`space-${index}`} className='character character--extra extra-space'>
          ·
        </span>
      ))}
      {Array.from({ length }, (_, index) => (
        <span
          key={index}
          className={`character character--${getCharacterStatus(word, input, index, completed)}`}
        >
          {active && index === cursor && <span className='caret' data-caret='' />}
          {word[index] ?? input?.text[index]}
        </span>
      ))}
      {active && cursor >= word.length && (
        <span className='caret-anchor'>
          <span className='caret' data-caret='' />
        </span>
      )}
    </span>
  );
});
