import type { ComponentProps } from "react";

export const SegmentedControl = ({ className = "", ...props }: ComponentProps<"div">) => (
  <div role="group" className={`flex h-11 rounded-invest-button border border-invest-divider bg-invest-background p-0.75 ${className}`} {...props} />
);
