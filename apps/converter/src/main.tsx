import { createRoot } from "react-dom/client";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./app/styles/index.css";
import { App } from "./app/App";

createRoot(document.getElementById("root")!).render(<App />);
