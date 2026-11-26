import { createRoot } from "react-dom/client";

import { Providers } from "@/app";
import "@/app/styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error('Missing application root "#root"');
}

createRoot(root).render(<Providers />);
