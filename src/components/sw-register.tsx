"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") {
      // Avoid sticky caches during local Next.js HMR.
      navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }

    void navigator.serviceWorker.register("/sw.js").catch(() => {
      // Ignore registration failures (private mode, etc.)
    });
  }, []);

  return null;
}
