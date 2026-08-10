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
  slipPathPrefix = "/slips",
  coIssue = false,
  initialStudentId,
}: {
  schoolId: string;
  schoolName: string;
  students: IssueDeskStudent[];
  kits: IssueDeskKit[];
  items: IssueDeskItem[];
  balances: IssueDeskBalance[];
  slipPathPrefix?: string;
  coIssue?: boolean;
  /** Deep-link from Still owed — preselect student and load owed lines */
  initialStudentId?: string;
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
      {coIssue && (
        <p className="card-inset no-print text-sm">
          Co-issue at <strong>{schoolName}</strong> — using school stock and
          roster. Slip stays on the school record; you are recorded as issuer.
        </p>
      )}
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
        slipPathPrefix={slipPathPrefix}
        initialStudentId={initialStudentId}
      />
    </>
  );
}
