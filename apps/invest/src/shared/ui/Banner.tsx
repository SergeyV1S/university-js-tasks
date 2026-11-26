import type { ComponentProps } from "react";

type BannerProps = ComponentProps<"div"> & { variant?: "warning" | "success" };

const variants = {
  warning: "border-invest-selected bg-invest-warning-background text-invest-warning",
  success: "border-invest-border bg-invest-surface text-invest-positive"
};

export const Banner = ({ variant = "warning", className = "", ...props }: BannerProps) => (
  <div className={`rounded-[10px] border ${variants[variant]} ${className}`} {...props} />
);
