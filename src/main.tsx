import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Offline service worker — only in production, skip Lovable preview / dev sandboxes
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const host = window.location.hostname;
  const isPreview = /lovableproject\.com$|lovable\.app$/.test(host) && host.includes("preview");
  if (!isPreview) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    });
  }
}
