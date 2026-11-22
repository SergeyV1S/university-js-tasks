import type { ComponentProps } from "react";

export const Banner = ({ className = "", ...props }: ComponentProps<"div">) => (
  <div
    className={`rounded-[10px] border border-invest-selected bg-invest-warning-background text-invest-warning ${className}`}
    {...props}
  />
);
