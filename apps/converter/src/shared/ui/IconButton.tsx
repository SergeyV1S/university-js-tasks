import type { ComponentProps } from "react";
import { cn } from "@/shared/helpers";

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  icon: string;
  label: string;
};

export const IconButton = ({ icon, label, className, ...props }: IconButtonProps) => (
  <button
    type='button'
    aria-label={label}
    title={label}
    className={cn(
      "inline-flex shrink-0 items-center justify-center rounded-full transition",
      "hover:opacity-70 active:scale-95",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      className
    )}
    {...props}
  >
    <img src={icon} alt='' className='block' />
  </button>
);
