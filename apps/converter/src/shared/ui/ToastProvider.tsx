import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Toast } from "./Toast";
import { ToastContext, type ToastItem, type ToastOptions } from "./toastContext";

type ToastProviderProps = {
  children: ReactNode;
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const showToast = useCallback((options: ToastOptions) => {
    const toast = { ...options, id: nextId.current++ };
    setToasts((current) => [...current, toast]);
  }, []);

  const closeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const context = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={context}>
      {children}
      {createPortal(
        <div
          aria-label='Уведомления'
          className='pointer-events-none fixed inset-x-0 top-5 z-50 mx-auto flex max-h-[calc(100dvh-40px)] max-w-app flex-col gap-3 overflow-y-auto px-5'
        >
          {toasts.map((toast) => (
            <ToastNotification key={toast.id} toast={toast} onClose={closeToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

const ToastNotification = ({
  toast,
  onClose
}: {
  toast: ToastItem;
  onClose: (id: number) => void;
}) => {
  const close = useCallback(() => onClose(toast.id), [onClose, toast.id]);

  return <Toast {...toast} onClose={close} />;
};
