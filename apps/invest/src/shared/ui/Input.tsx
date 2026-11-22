import type { ComponentProps } from "react";

export const Input = ({ className = "", ...props }: ComponentProps<"input">) => (
  <input
    className={`w-full min-w-0 rounded-invest-input border border-invest-border bg-invest-background px-3 text-invest-body text-invest-foreground placeholder:text-invest-muted focus-visible:-outline-offset-1 aria-invalid:border-invest-negative ${className}`}
    {...props}
  />
);
