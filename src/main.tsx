import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";

// Runtime config: Use Vite env in dev, or placeholder that gets replaced in Docker
// The string concatenation prevents Vite from optimizing this away
const RUNTIME_PLACEHOLDER = "__CONVEX" + "_URL_PLACEHOLDER__";
const convexUrl = import.meta.env.VITE_CONVEX_URL || RUNTIME_PLACEHOLDER;

function showError(message: string) {
  document.getElementById("root")!.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; padding: 20px; text-align: center;">
      <h1 style="color: #dc2626; margin-bottom: 16px;">Configuration Error</h1>
      <p style="color: #374151; max-width: 500px;">${message}</p>
    </div>
  `;
}

if (!convexUrl || convexUrl.includes("PLACEHOLDER")) {
  showError(`
    <code>VITE_CONVEX_URL</code> environment variable is not set.<br><br>
    Add it to your Docker container environment variables.
  `);
  throw new Error("VITE_CONVEX_URL environment variable is not set");
}

const convex = new ConvexReactClient(convexUrl, {
  verbose: true,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <App />
    </ConvexAuthProvider>
  </StrictMode>
);
