import { useEffect } from "react";
import { clearIcon } from "@/shared/assets";
import { cn } from "@/shared/helpers";
import { IconButton } from "./IconButton";
import type { ToastOptions } from "./toastContext";

type ToastProps = ToastOptions & {
  onClose: () => void;
};

export const Toast = ({ message, variant = "info", duration = 6000, onClose }: ToastProps) => {
  useEffect(() => {
    if (duration <= 0) return;

    const timeout = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeout);
  }, [duration, onClose]);

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-atomic='true'
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-field border-l-4 bg-surface p-4 shadow-item",
        variant === "error" && "border-error",
        variant === "success" && "border-accent",
        variant === "info" && "border-muted"
      )}
    >
      <p className='min-w-0 flex-1 text-sm break-words'>{message}</p>
      <IconButton
        icon={clearIcon}
        label='Закрыть уведомление'
        className='-m-1 p-1'
        onClick={onClose}
      />
    </div>
  );
};
