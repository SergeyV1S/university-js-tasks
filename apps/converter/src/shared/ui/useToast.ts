import { useContext } from "react";
import { ToastContext } from "./toastContext";

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast необходимо использовать внутри ToastProvider");
  }

  return context;
};
