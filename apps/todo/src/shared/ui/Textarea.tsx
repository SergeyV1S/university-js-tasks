import type { ComponentProps } from "react";
import { cn } from "@/shared/helpers";

export const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    className={cn(
      "w-full resize-none bg-transparent font-light text-input text-foreground caret-accent outline-none",
      "placeholder:text-muted",
      className
    )}
    {...props}
  />
);
