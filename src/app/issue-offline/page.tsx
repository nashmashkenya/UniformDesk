"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { IssueForm } from "@/components/issue-form";
import {
  loadIssueSnapshot,
  type IssueDeskSnapshot,
} from "@/lib/offline-issue-snapshot";

export default function IssueOfflinePage() {
  const [snapshot, setSnapshot] = useState<IssueDeskSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadIssueSnapshot()
      .then((row) => setSnapshot(row))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="desk-main mx-auto max-w-3xl flex-1 px-4 py-6">
      <header className="page-header">
        <div className="page-header-main">
          <p className="text-xs text-[var(--muted)]">
            <Link href="/offline" className="text-[var(--accent)]">
              Offline
            </Link>
          </p>
          <h1 className="page-title">Cached issue desk</h1>
          <p className="page-sub">
            Works from the last roster saved on this device. Slips queue until
            sync.
          </p>
        </div>
      </header>

      {loading && (
        <p className="text-sm text-[var(--muted)]">Loading cached roster…</p>
      )}

      {!loading && !snapshot && (
        <section className="card">
          <div className="card-body space-y-3 text-sm">
            <p>
              No cached roster on this device yet. Open the desk home or issue
              page once while online, then return here if the network drops.
            </p>
            <Link href="/login" className="btn btn-primary">
              Sign in when online
            </Link>
          </div>
        </section>
      )}

      {snapshot && (
        <>
          <p className="mb-3 text-xs text-[var(--muted)]">
            {snapshot.schoolName} · cached{" "}
            {formatDistanceToNow(new Date(snapshot.savedAt), {
              addSuffix: true,
            })}{" "}
            · {snapshot.students.length} students
          </p>
          <IssueForm
            schoolId={snapshot.schoolId}
            students={snapshot.students}
            kits={snapshot.kits}
            items={snapshot.items}
            balances={snapshot.balances}
            cachedMode
          />
        </>
      )}
    </main>
  );
}
