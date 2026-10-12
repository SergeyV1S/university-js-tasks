import type { ComponentProps } from "react";
import { cn } from "@/shared/helpers";
import { ThemedImage } from "./ThemedImage";

export type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  icon: string;
  darkIcon?: string;
  label: string;
};

export const IconButton = ({ icon, darkIcon, label, className, ...props }: IconButtonProps) => (
  <button
    type='button'
    aria-label={label}
    title={label}
    className={cn(
      "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition",
      "hover:opacity-80 active:scale-95",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      "disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100",
      className
    )}
    {...props}
  >
    <ThemedImage src={icon} darkSrc={darkIcon} />
  </button>
);
