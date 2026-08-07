"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SignaturePad } from "@/components/signature-pad";
import { enqueueIssue } from "@/lib/offline-issue-queue";
import {
  applyIssueToBalances,
  patchIssueSnapshotBalances,
  type IssueDeskBalance,
  type IssueDeskItem,
  type IssueDeskKit,
  type IssueDeskStudent,
} from "@/lib/offline-issue-snapshot";

type Line = {
  itemId: string;
  sizeLabel: string;
  qtyRequested: number;
};

export function IssueForm({
  schoolId,
  students,
  kits,
  items,
  balances: initialBalances,
  cachedMode = false,
}: {
  schoolId: string;
  students: IssueDeskStudent[];
  kits: IssueDeskKit[];
  items: IssueDeskItem[];
  balances: IssueDeskBalance[];
  cachedMode?: boolean;
}) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuedNote, setQueuedNote] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState("");
  const [kitId, setKitId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [signature, setSignature] = useState("");
  const [ackName, setAckName] = useState("");
  const [signatureKey, setSignatureKey] = useState(0);
  const [balances, setBalances] = useState(initialBalances);

  useEffect(() => {
    setBalances(initialBalances);
  }, [initialBalances]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students.slice(0, 8);
    return students
      .filter(
        (s) =>
          s.admissionNo.toLowerCase().includes(q) ||
          s.fullName.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, students]);

  const selectedStudent = students.find((s) => s.id === studentId);

  useEffect(() => {
    setOnline(navigator.onLine);
    function onOnline() {
      setOnline(true);
    }
    function onOffline() {
      setOnline(false);
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  function stockFor(itemId: string, sizeLabel: string) {
    return (
      balances.find((b) => b.itemId === itemId && b.sizeLabel === sizeLabel)
        ?.qtyOnHand ?? 0
    );
  }

  function applyKit(id: string) {
    setKitId(id);
    const kit = kits.find((k) => k.id === id);
    if (!kit) return;
    setLines(
      kit.lines.map((line) => {
        const preferred =
          line.item.sizes.find((s) => stockFor(line.itemId, s.sizeLabel) > 0)
            ?.sizeLabel ??
          line.item.sizes[0]?.sizeLabel ??
          "M";
        return {
          itemId: line.itemId,
          sizeLabel: preferred,
          qtyRequested: line.qtyDefault,
        };
      }),
    );
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    );
  }

  function addLine() {
    const first = items[0];
    if (!first) return;
    setLines((prev) => [
      ...prev,
      {
        itemId: first.id,
        sizeLabel: first.sizes[0]?.sizeLabel ?? "M",
        qtyRequested: 1,
      },
    ]);
  }

  function resetForm() {
    setStudentId("");
    setKitId("");
    setLines([]);
    setSignature("");
    setAckName("");
    setQuery("");
    setSignatureKey((k) => k + 1);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setQueuedNote(null);

    if (!studentId || !lines.length || !signature || !ackName.trim()) {
      setError("Student, lines, name, and signature are required");
      return;
    }

    const payload = {
      studentId,
      acknowledgmentName: ackName.trim(),
      acknowledgmentSignature: signature,
      lines,
      studentLabel: selectedStudent
        ? `${selectedStudent.fullName} (${selectedStudent.admissionNo})`
        : undefined,
    };

    setPending(true);
    try {
      async function queueOffline(note: string) {
        await enqueueIssue(payload);
        setBalances((prev) => applyIssueToBalances(prev, lines));
        void patchIssueSnapshotBalances(schoolId, lines);
        window.dispatchEvent(new Event("ud-issue-queued"));
        resetForm();
        setQueuedNote(note);
      }

      if (!navigator.onLine || cachedMode) {
        await queueOffline(
          "Saved offline. This issue will sync when you’re back online.",
        );
        return;
      }

      const res = await fetch("/api/v1/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        slipId?: string;
      };

      if (!res.ok) {
        if (res.status >= 500 || res.status === 0) {
          await queueOffline(
            "Server unreachable. Issue queued and will sync automatically.",
          );
          return;
        }
        throw new Error(data.error || "Could not issue kit");
      }

      if (!data.slipId) throw new Error("Issue saved but slip id missing");
      router.push(`/slips/${data.slipId}`);
      router.refresh();
    } catch (err) {
      const networkFail =
        !navigator.onLine ||
        err instanceof TypeError ||
        (err instanceof Error && /fetch|network|failed/i.test(err.message));
      if (networkFail) {
        try {
          await enqueueIssue(payload);
          setBalances((prev) => applyIssueToBalances(prev, lines));
          void patchIssueSnapshotBalances(schoolId, lines);
          window.dispatchEvent(new Event("ud-issue-queued"));
          resetForm();
          setQueuedNote(
            "Connection problem. Issue queued and will sync automatically.",
          );
          return;
        } catch {
          // fall through
        }
      }
      setError(err instanceof Error ? err.message : "Could not issue kit");
    } finally {
      setPending(false);
    }
  }

  const canSubmit = Boolean(studentId && lines.length && signature && !pending);

  return (
    <form onSubmit={onSubmit} className="page-stack pb-2">
      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">1</span>
          <div>
            <h2 className="card-title">Find student</h2>
            <p className="card-subtitle">Search by admission number or name</p>
          </div>
        </div>
        <div className="step-card-body">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Admission number or name"
            inputMode="search"
            autoComplete="off"
            className="field"
          />
          <ul className="card-inset mt-3 max-h-64 overflow-y-auto !p-0">
            {filtered.map((student) => {
              const selected = studentId === student.id;
              return (
                <li
                  key={student.id}
                  className="border-b border-[var(--line)] last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setStudentId(student.id);
                      setAckName(student.fullName);
                    }}
                    className={`flex min-h-12 w-full items-center justify-between gap-2 px-3 py-2.5 text-left ${
                      selected
                        ? "bg-[var(--accent-soft)]"
                        : "hover:bg-[var(--wash)]"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">
                        {student.fullName}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {student.admissionNo}
                        {student.className ? ` · ${student.className}` : ""}
                      </span>
                    </span>
                    {selected && <span className="chip chip-ok">Selected</span>}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-sm text-[var(--muted)]">
                No students found.
              </li>
            )}
          </ul>
          {selectedStudent && (
            <p className="mt-3 text-sm text-[var(--accent)]">
              Issuing to {selectedStudent.fullName}
            </p>
          )}
        </div>
      </section>

      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">2</span>
          <div className="min-w-0 flex-1">
            <h2 className="card-title">Kit / items</h2>
            <p className="card-subtitle">Load a kit or add lines manually</p>
          </div>
          <select
            value={kitId}
            onChange={(e) => applyKit(e.target.value)}
            className="field max-w-[11rem] sm:max-w-xs"
          >
            <option value="">Load a kit…</option>
            {kits.map((kit) => (
              <option key={kit.id} value={kit.id}>
                {kit.name}
              </option>
            ))}
          </select>
        </div>
        <div className="step-card-body space-y-3">
          {lines.map((line, index) => {
            const item = items.find((i) => i.id === line.itemId);
            const onHand = stockFor(line.itemId, line.sizeLabel);
            const shortage = Math.max(0, line.qtyRequested - onHand);
            return (
              <div
                key={`${line.itemId}-${index}`}
                className="card-inset grid gap-2"
              >
                <select
                  value={line.itemId}
                  onChange={(e) => {
                    const next = items.find((i) => i.id === e.target.value);
                    updateLine(index, {
                      itemId: e.target.value,
                      sizeLabel: next?.sizes[0]?.sizeLabel ?? "M",
                    });
                  }}
                  className="field"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={line.sizeLabel}
                    onChange={(e) =>
                      updateLine(index, { sizeLabel: e.target.value })
                    }
                    className="field"
                  >
                    {(item?.sizes ?? []).map((s) => (
                      <option key={s.sizeLabel} value={s.sizeLabel}>
                        Size {s.sizeLabel} (
                        {stockFor(line.itemId, s.sizeLabel)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    inputMode="numeric"
                    value={line.qtyRequested}
                    onChange={(e) =>
                      updateLine(index, {
                        qtyRequested: Number(e.target.value) || 1,
                      })
                    }
                    className="field"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="chip">On hand {onHand}</span>
                  {shortage > 0 ? (
                    <span className="chip chip-warn">Shortage {shortage}</span>
                  ) : (
                    <span className="chip chip-ok">Enough stock</span>
                  )}
                </div>
              </div>
            );
          })}
          {lines.length === 0 && (
            <p className="text-sm text-[var(--muted)]">
              Load a kit or add item lines to continue.
            </p>
          )}
          <button type="button" onClick={addLine} className="btn btn-secondary">
            + Add item line
          </button>
        </div>
      </section>

      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">3</span>
          <div>
            <h2 className="card-title">Acknowledgment</h2>
            <p className="card-subtitle">Signature required before save</p>
          </div>
        </div>
        <div className="step-card-body">
          <label className="block text-sm font-semibold">
            Signed by
            <input
              value={ackName}
              onChange={(e) => setAckName(e.target.value)}
              className="field mt-1.5"
              required
            />
          </label>
          <div className="mt-4">
            <SignaturePad
              key={signatureKey}
              name="signaturePad"
              onChange={setSignature}
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="card-inset border-[color-mix(in_srgb,var(--danger)_35%,var(--line))] bg-[var(--danger-soft)] text-sm text-[var(--danger)]">
          {error}
        </p>
      )}
      {queuedNote && (
        <p className="card-inset border-[color-mix(in_srgb,var(--ok)_35%,var(--line))] bg-[var(--ok-soft)] text-sm text-[var(--ok)]">
          {queuedNote}
        </p>
      )}

      <div className="sticky-actions no-print">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn-primary w-full"
        >
          {pending
            ? "Saving issue…"
            : online && !cachedMode
              ? "Complete issue & print slip"
              : "Queue issue offline"}
        </button>
      </div>
    </form>
  );
}
