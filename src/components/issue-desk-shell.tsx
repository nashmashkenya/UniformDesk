"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { IssueForm } from "@/components/issue-form";
import {
  saveIssueSnapshot,
  type IssueDeskBalance,
  type IssueDeskItem,
  type IssueDeskKit,
  type IssueDeskStudent,
} from "@/lib/offline-issue-snapshot";

export function IssueDeskShell({
  schoolId,
  schoolName,
  students,
  kits,
  items,
  balances,
}: {
  schoolId: string;
  schoolName: string;
  students: IssueDeskStudent[];
  kits: IssueDeskKit[];
  items: IssueDeskItem[];
  balances: IssueDeskBalance[];
}) {
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const snapshot = {
      schoolId,
      schoolName,
      savedAt: new Date().toISOString(),
      students,
      kits,
      items,
      balances,
    };
    void saveIssueSnapshot(snapshot).then(() => setSavedAt(snapshot.savedAt));
  }, [schoolId, schoolName, students, kits, items, balances]);

  return (
    <>
      {savedAt && (
        <p className="no-print text-xs text-[var(--muted)]">
          Offline cache ready · roster saved{" "}
          {formatDistanceToNow(new Date(savedAt), { addSuffix: true })}
        </p>
      )}
      <IssueForm
        schoolId={schoolId}
        students={students}
        kits={kits}
        items={items}
        balances={balances}
      />
    </>
  );
}
