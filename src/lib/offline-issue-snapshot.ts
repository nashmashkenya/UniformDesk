import {
  openOfflineDb,
  STORE_SNAPSHOT,
  txDone,
} from "@/lib/offline-db";

export type IssueDeskStillLine = {
  itemId: string;
  itemName: string;
  qtyOwed: number;
  sizeLabel?: string | null;
  moneyStatus?: "unpaid" | "paid" | "deposit" | "waived";
  holdReason?: string | null;
};

export type IssueDeskUniformLine = {
  itemId: string;
  itemName: string;
  sku: string;
  qtyNeeded: number;
  qtyReceived: number;
  qtyLeft: number;
  sizeLabel: string | null;
  unitPriceCents: number;
  moneyStatus: "unpaid" | "paid" | "deposit" | "waived";
  holdReason: string | null;
};

export type IssueDeskUniformSet = {
  planId: string;
  kitId: string | null;
  label: string;
  lines: IssueDeskUniformLine[];
};

export type IssueDeskStudent = {
  id: string;
  admissionNo: string;
  fullName: string;
  className: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  /** Plain-language remaining kit items, if any */
  stillToReceive?: {
    label: string;
    totalOwed: number;
    lines: IssueDeskStillLine[];
  } | null;
  /** Full kit for this student — given and not given */
  uniformSet?: IssueDeskUniformSet | null;
};

export type IssueDeskItem = {
  id: string;
  name: string;
  sku: string;
  sizes: { sizeLabel: string }[];
  unitPriceCents: number;
};

export type IssueDeskKit = {
  id: string;
  name: string;
  lines: {
    itemId: string;
    qtyDefault: number;
    item: IssueDeskItem;
  }[];
};

export type IssueDeskBalance = {
  itemId: string;
  sizeLabel: string;
  qtyOnHand: number;
};

export type IssueDeskSnapshot = {
  schoolId: string;
  schoolName: string;
  savedAt: string;
  students: IssueDeskStudent[];
  kits: IssueDeskKit[];
  items: IssueDeskItem[];
  balances: IssueDeskBalance[];
};

export function applyIssueToBalances(
  balances: IssueDeskBalance[],
  lines: { itemId: string; sizeLabel: string; qtyRequested: number }[],
): IssueDeskBalance[] {
  const next = balances.map((b) => ({ ...b }));
  for (const line of lines) {
    const idx = next.findIndex(
      (b) => b.itemId === line.itemId && b.sizeLabel === line.sizeLabel,
    );
    if (idx >= 0) {
      next[idx] = {
        ...next[idx],
        qtyOnHand: Math.max(0, next[idx].qtyOnHand - line.qtyRequested),
      };
    }
  }
  return next;
}

export async function saveIssueSnapshot(snapshot: IssueDeskSnapshot) {
  const db = await openOfflineDb();
  const tx = db.transaction(STORE_SNAPSHOT, "readwrite");
  tx.objectStore(STORE_SNAPSHOT).put(snapshot);
  await txDone(tx);
  db.close();
}

export async function loadIssueSnapshot(schoolId?: string) {
  const db = await openOfflineDb();
  const tx = db.transaction(STORE_SNAPSHOT, "readonly");
  const store = tx.objectStore(STORE_SNAPSHOT);

  let row: IssueDeskSnapshot | undefined;
  if (schoolId) {
    row = await new Promise((resolve, reject) => {
      const req = store.get(schoolId);
      req.onsuccess = () =>
        resolve(req.result as IssueDeskSnapshot | undefined);
      req.onerror = () =>
        reject(req.error ?? new Error("IndexedDB get failed"));
    });
  } else {
    const all = await new Promise<IssueDeskSnapshot[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () =>
        resolve((req.result as IssueDeskSnapshot[]) ?? []);
      req.onerror = () =>
        reject(req.error ?? new Error("IndexedDB read failed"));
    });
    row = all.sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
  }

  await txDone(tx);
  db.close();
  return row ?? null;
}

export async function patchIssueSnapshotBalances(
  schoolId: string,
  lines: { itemId: string; sizeLabel: string; qtyRequested: number }[],
) {
  const current = await loadIssueSnapshot(schoolId);
  if (!current) return null;
  const updated: IssueDeskSnapshot = {
    ...current,
    balances: applyIssueToBalances(current.balances, lines),
    savedAt: current.savedAt,
  };
  await saveIssueSnapshot(updated);
  return updated;
}
