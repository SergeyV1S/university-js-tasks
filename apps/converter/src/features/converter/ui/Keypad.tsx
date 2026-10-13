import { backspaceIcon } from "@/shared/assets";
import { cn } from "@/shared/helpers";
import { INPUT_KEYS } from "../constants";
import type { KeypadKey } from "../types";
import { KeypadButton } from "./KeypadButton";

type KeypadProps = {
  className?: string;
  onPress: (key: KeypadKey) => void;
};

export const Keypad = ({ className, onPress }: KeypadProps) => (
  <div
    className={cn(
      "grid max-h-[407px] min-h-[252px] flex-1 grid-cols-6 grid-rows-5 gap-2",
      className
    )}
  >
    <KeypadButton
      aria-label='Очистить'
      className='col-span-3 text-accent'
      onClick={() => onPress("clear")}
    >
      AC
    </KeypadButton>
    <KeypadButton
      aria-label='Стереть символ'
      className='col-span-3'
      onClick={() => onPress("backspace")}
    >
      <img src={backspaceIcon} alt='' className='block' />
    </KeypadButton>

    {INPUT_KEYS.map((key) => (
      <KeypadButton
        key={key}
        className={key === "0" ? "col-span-4" : "col-span-2"}
        onClick={() => onPress(key)}
      >
        {key}
      </KeypadButton>
    ))}
  </div>
);
