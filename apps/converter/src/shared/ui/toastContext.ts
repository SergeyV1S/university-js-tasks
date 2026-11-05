import { createContext } from "react";

export type ToastOptions = {
  message: string;
  variant?: "info" | "success" | "error";
  duration?: number;
};

export type ToastItem = ToastOptions & { id: number };

export type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
