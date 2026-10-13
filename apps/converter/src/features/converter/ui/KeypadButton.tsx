import type { ComponentProps } from "react";
import { cn } from "@/shared/helpers";

export const KeypadButton = ({ className, ...props }: ComponentProps<"button">) => (
  <button
    type='button'
    className={cn(
      "flex items-center justify-center rounded-card bg-surface text-amount select-none",
      "shadow-key inset-shadow-key transition active:scale-[0.97] active:bg-field",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      className
    )}
    {...props}
  />
);
