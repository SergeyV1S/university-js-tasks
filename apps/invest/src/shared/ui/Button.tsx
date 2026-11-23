import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  variant?: "secondary" | "primary" | "ghost" | "selected" | "segment";
};

const variants = {
  secondary:
    "border border-invest-border bg-invest-surface text-invest-foreground hover:border-invest-muted",
  primary:
    "bg-invest-accent text-invest-accent-ink focus-visible:outline-offset-2 enabled:hover:bg-invest-accent-hover enabled:active:bg-invest-accent-pressed",
  ghost: "text-invest-muted hover:text-invest-foreground aria-pressed:text-invest-accent",
  selected: "border border-invest-accent bg-invest-selected text-invest-accent",
  segment:
    "min-w-0 flex-1 text-invest-muted hover:text-invest-foreground aria-pressed:bg-invest-selected aria-pressed:font-bold aria-pressed:text-invest-accent aria-pressed:inset-ring aria-pressed:inset-ring-invest-selected-border"
};

export const Button = ({
  variant = "secondary",
  type = "button",
  className = "",
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 text-invest-label disabled:cursor-default ${variant !== "primary" ? "focus-visible:-outline-offset-2" : ""} ${variant === "segment" ? "rounded-md" : "rounded-invest-button disabled:opacity-50"} ${variants[variant]} ${className}`}
    {...props}
  />
);
