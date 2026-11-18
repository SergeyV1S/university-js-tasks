import type { ComponentProps } from "react";
import { Icon, type IconName } from "./Icon";

type ButtonProps = ComponentProps<"button"> & {
  icon: IconName;
  variant?: "primary" | "secondary";
};

export const Button = ({
  icon,
  variant = "secondary",
  className = "",
  children,
  ...props
}: ButtonProps) => (
  <button type='button' className={`button button--${variant} ${className}`} {...props}>
    <span>{children}</span>
    <Icon name={icon} />
  </button>
);
