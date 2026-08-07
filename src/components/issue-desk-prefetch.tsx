"use client";

import { useEffect } from "react";
import {
  saveIssueSnapshot,
  type IssueDeskSnapshot,
} from "@/lib/offline-issue-snapshot";

/** Warm IndexedDB issue roster while the desk is online. */
export function IssueDeskPrefetch() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/v1/issue-desk");
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as IssueDeskSnapshot;
        if (!data?.schoolId || cancelled) return;
        await saveIssueSnapshot(data);
      } catch {
        // Prefetch is best-effort
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
