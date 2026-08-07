"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listQueuedIssues,
  syncQueuedIssues,
  type QueuedIssue,
} from "@/lib/offline-issue-queue";

export function OfflineSyncBanner() {
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedIssue[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setQueue(await listQueuedIssues());
    } catch {
      setQueue([]);
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return;
    setSyncing(true);
    setMessage(null);
    try {
      const result = await syncQueuedIssues();
      await refresh();
      if (result.synced > 0) {
        setMessage(`Synced ${result.synced} queued issue${result.synced === 1 ? "" : "s"}`);
      } else if (result.failed > 0) {
        setMessage(result.lastError || "Some queued issues failed to sync");
      }
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void refresh();

    function onOnline() {
      setOnline(true);
      void runSync();
    }
    function onOffline() {
      setOnline(false);
    }
    function onQueueChanged() {
      void refresh();
    }

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("ud-issue-queued", onQueueChanged);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("ud-issue-queued", onQueueChanged);
    };
  }, [refresh, runSync]);

  if (online && queue.length === 0 && !message) return null;

  return (
    <div className="no-print border-b border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
        <div>
          {!online && (
            <span className="font-semibold text-[var(--warn)]">Offline</span>
          )}
          {!online && queue.length > 0 && " · "}
          {queue.length > 0 && (
            <span>
              {queue.length} issue{queue.length === 1 ? "" : "s"} waiting to sync
            </span>
          )}
          {message && (
            <span className={queue.length ? " · " : ""}>
              <span className="text-[var(--muted)]">{message}</span>
            </span>
          )}
        </div>
        {queue.length > 0 && online && (
          <button
            type="button"
            className="btn btn-ghost min-h-8 px-3 text-xs"
            disabled={syncing}
            onClick={() => void runSync()}
          >
            {syncing ? "Syncing…" : "Sync now"}
          </button>
        )}
      </div>
    </div>
  );
}
