import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
} else {
  throw new Error("Root element #root not found");
}
