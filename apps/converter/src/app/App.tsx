import { ConverterPage } from "@/pages/converter";
import { ToastProvider } from "@/shared/ui";

export const App = () => (
  <ToastProvider>
    <ConverterPage />
  </ToastProvider>
);
