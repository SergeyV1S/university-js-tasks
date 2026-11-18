import { useEffect, useLayoutEffect, useRef, type InputEvent, type KeyboardEvent } from "react";
import type { TestState } from "@/entities/test";
import { TypingWord } from "./TypingWord";

type TypingAreaProps = {
  test: TestState;
  onType: (character: string) => void;
  onBackspace: () => void;
};

// A native Backspace needs something to delete, including on virtual keyboards.
const INPUT_PLACEHOLDER = "\u200b";

const resetInput = (input: HTMLTextAreaElement) => {
  input.value = INPUT_PLACEHOLDER;
  input.setSelectionRange(INPUT_PLACEHOLDER.length, INPUT_PLACEHOLDER.length);
};

const keepCaretVisible = (viewport: HTMLDivElement) => {
  const caret = viewport.querySelector<HTMLElement>("[data-caret]");
  if (!caret) return;
  const top = caret.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  const lineHeight = Number.parseFloat(getComputedStyle(viewport).lineHeight);
  if (top >= lineHeight * 3) viewport.scrollTop += top - lineHeight * 2;
  else if (top < 0) viewport.scrollTop += top - 6;
};

export const TypingArea = ({ test, onType, onBackspace }: TypingAreaProps) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const activeWord = test.inputs.length - 1;
  const readyInputs = test.phase === "ready" ? test.inputs : null;

  useEffect(() => {
    if (!readyInputs) return;
    const input = inputRef.current;
    if (input) {
      input.focus({ preventScroll: true });
      resetInput(input);
    }
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [readyInputs]);

  useLayoutEffect(() => {
    if (viewportRef.current) keepCaretVisible(viewportRef.current);
  }, [test.inputs]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => keepCaretVisible(viewport));
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Backspace") {
      event.preventDefault();
      onBackspace();
    } else if (event.key === "Enter") {
      event.preventDefault();
    }
  };

  const commitInput = (input: HTMLTextAreaElement, text: string) => {
    resetInput(input);
    for (const character of text) onType(character);
  };

  const handleInput = ({ currentTarget, nativeEvent }: InputEvent<HTMLTextAreaElement>) => {
    if (nativeEvent.isComposing) return;
    if (nativeEvent.inputType === "deleteContentBackward") {
      resetInput(currentTarget);
      onBackspace();
      return;
    }
    commitInput(currentTarget, currentTarget.value.replace(INPUT_PLACEHOLDER, ""));
  };

  const focusInput = () => inputRef.current?.focus({ preventScroll: true });

  return (
    <div className='typing-area'>
      <textarea
        ref={inputRef}
        className='typing-input'
        aria-label='Ввод текста теста'
        aria-describedby='typing-instructions typing-current-word'
        autoCapitalize='off'
        autoComplete='off'
        autoCorrect='off'
        spellCheck={false}
        defaultValue={INPUT_PLACEHOLDER}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onCompositionEnd={({ currentTarget, data }) => commitInput(currentTarget, data)}
        onPaste={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
      />
      <p id='typing-instructions' className='sr-only'>
        Печатайте текст с клавиатуры. Пробел переходит к следующему слову, Backspace исправляет
        ввод. Таймер запускается с первого символа.
      </p>
      <p id='typing-current-word' className='sr-only' aria-live='polite'>
        Слово {activeWord + 1}: {test.words[activeWord]}
      </p>
      <div ref={viewportRef} className='typing-viewport' aria-hidden='true' onClick={focusInput}>
        {test.words.map((word, index) => (
          <span key={index}>
            <TypingWord
              word={word}
              input={test.inputs[index]}
              completed={index < activeWord}
              active={index === activeWord}
            />
            {index < test.words.length - 1 && " "}
          </span>
        ))}
      </div>
      <button type='button' className='focus-prompt' onClick={focusInput}>
        Нажмите на текст, чтобы продолжить
      </button>
    </div>
  );
};
