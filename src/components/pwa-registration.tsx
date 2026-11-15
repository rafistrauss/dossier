"use client";

import { useEffect } from "react";

/** Register only in production; local development must not acquire a worker. */
export function PwaRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !window.isSecureContext || !("serviceWorker" in navigator)) return;
    // Installation is optional. A failed registration must not interrupt work.
    void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
