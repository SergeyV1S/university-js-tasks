import type { ComponentProps } from "react";

export const Input = ({ className = "", ...props }: ComponentProps<"input">) => (
  <input
    className={`invest-field w-full min-w-0 rounded-invest-input border border-invest-field-border bg-invest-background px-3 text-invest-body text-invest-foreground placeholder:text-invest-muted aria-invalid:border-invest-negative ${className}`}
    {...props}
  />
);
