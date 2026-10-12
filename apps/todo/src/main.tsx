import { createRoot } from "react-dom/client";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "./app/styles/index.css";
import { App } from "./app/App";
import { initTheme } from "@/features/theme";

initTheme();

createRoot(document.getElementById("root")!).render(<App />);
