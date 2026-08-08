import { openOfflineDb, STORE_QUEUE, txDone } from "@/lib/offline-db";

export type QueuedIssuePayload = {
  studentId: string;
  schoolId?: string;
  kitId?: string;
  paymentMethod: "cash" | "bank" | "mpesa" | "other";
  paymentReference?: string;
  lines: {
    itemId: string;
    sizeLabel: string;
    qtyRequested: number;
  }[];
  studentLabel?: string;
};

export type QueuedIssue = {
  id: string;
  createdAt: string;
  payload: QueuedIssuePayload;
  lastError?: string;
};

export async function enqueueIssue(payload: QueuedIssuePayload) {
  const item: QueuedIssue = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    payload,
  };
  const db = await openOfflineDb();
  const tx = db.transaction(STORE_QUEUE, "readwrite");
  tx.objectStore(STORE_QUEUE).put(item);
  await txDone(tx);
  db.close();
  return item;
}

export async function listQueuedIssues() {
  const db = await openOfflineDb();
  const tx = db.transaction(STORE_QUEUE, "readonly");
  const req = tx.objectStore(STORE_QUEUE).getAll();
  const rows = await new Promise<QueuedIssue[]>((resolve, reject) => {
    req.onsuccess = () => resolve((req.result as QueuedIssue[]) ?? []);
    req.onerror = () =>
      reject(req.error ?? new Error("IndexedDB read failed"));
  });
  await txDone(tx);
  db.close();
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeQueuedIssue(id: string) {
  const db = await openOfflineDb();
  const tx = db.transaction(STORE_QUEUE, "readwrite");
  tx.objectStore(STORE_QUEUE).delete(id);
  await txDone(tx);
  db.close();
}

export async function markQueuedIssueError(id: string, lastError: string) {
  const db = await openOfflineDb();
  const tx = db.transaction(STORE_QUEUE, "readwrite");
  const store = tx.objectStore(STORE_QUEUE);
  const existing = await new Promise<QueuedIssue | undefined>((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result as QueuedIssue | undefined);
    req.onerror = () =>
      reject(req.error ?? new Error("IndexedDB get failed"));
  });
  if (existing) {
    store.put({ ...existing, lastError });
  }
  await txDone(tx);
  db.close();
}

export async function queueCount() {
  const rows = await listQueuedIssues();
  return rows.length;
}

export type SyncResult = {
  synced: number;
  failed: number;
  lastError?: string;
};

export async function syncQueuedIssues(): Promise<SyncResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0, lastError: "Still offline" };
  }

  const rows = await listQueuedIssues();
  let synced = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const row of rows) {
    try {
      const res = await fetch("/api/v1/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(row.payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        slipId?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `Sync failed (${res.status})`);
      }
      await removeQueuedIssue(row.id);
      synced += 1;
    } catch (error) {
      failed += 1;
      lastError =
        error instanceof Error ? error.message : "Could not sync issue";
      await markQueuedIssueError(row.id, lastError);
      if (lastError.toLowerCase().includes("unauthorized")) break;
    }
  }

  return { synced, failed, lastError };
}
