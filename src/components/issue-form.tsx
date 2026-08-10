"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { addStudentAction } from "@/app/actions/students";
import { enqueueIssue } from "@/lib/offline-issue-queue";
import {
  applyIssueToBalances,
  loadIssueSnapshot,
  patchIssueSnapshotBalances,
  saveIssueSnapshot,
  type IssueDeskBalance,
  type IssueDeskItem,
  type IssueDeskKit,
  type IssueDeskStudent,
} from "@/lib/offline-issue-snapshot";

type Line = {
  itemId: string;
  sizeLabel: string;
  qtyRequested: number;
  /** Issue now from stock; false = hold for later */
  fulfil: boolean;
};

type StudentMode = "new" | "existing";
type PayMethod = "cash" | "bank" | "mpesa" | "other";
type MoneyStatus = "unpaid" | "paid" | "deposit" | "waived";

function moneyChip(status?: string | null) {
  if (status === "paid") return "Paid";
  if (status === "deposit") return "Deposit";
  if (status === "waived") return "Waived";
  return "Unpaid";
}

export function IssueForm({
  schoolId,
  students: initialStudents,
  kits,
  items,
  balances: initialBalances,
  cachedMode = false,
  initialStudentId,
}: {
  schoolId: string;
  students: IssueDeskStudent[];
  kits: IssueDeskKit[];
  items: IssueDeskItem[];
  balances: IssueDeskBalance[];
  cachedMode?: boolean;
  /** Deep-link from Still owed */
  initialStudentId?: string;
  /** @deprecated Parent slip not required */
  slipPathPrefix?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(false);
  const [admitPending, setAdmitPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queuedNote, setQueuedNote] = useState<string | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);
  const [mode, setMode] = useState<StudentMode>(
    initialStudentId ? "existing" : "new",
  );
  const [query, setQuery] = useState("");
  const [studentId, setStudentId] = useState(initialStudentId ?? "");
  const [students, setStudents] = useState(initialStudents);
  const [admissionNo, setAdmissionNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [kitId, setKitId] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PayMethod | "">("cash");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentAmountKes, setPaymentAmountKes] = useState("");
  const [moneyStatus, setMoneyStatus] = useState<MoneyStatus>("paid");
  const [balances, setBalances] = useState(initialBalances);
  const [prefillDone, setPrefillDone] = useState(false);

  useEffect(() => {
    setBalances(initialBalances);
  }, [initialBalances]);

  useEffect(() => {
    setStudents((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]));
      for (const s of initialStudents) byId.set(s.id, s);
      return [...byId.values()];
    });
  }, [initialStudents]);

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
          fulfil: true,
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
        fulfil: true,
      },
    ]);
  }

  function resetForm() {
    setStudentId("");
    setKitId("");
    setLines([]);
    setPaymentMethod("cash");
    setPaymentReference("");
    setPaymentAmountKes("");
    setMoneyStatus("paid");
    setQuery("");
    setAdmissionNo("");
    setFullName("");
    setClassName("");
    setParentName("");
    setParentPhone("");
    setMode("new");
  }

  const allHold = lines.length > 0 && lines.every((l) => !l.fulfil);
  const amountEntered = paymentAmountKes.trim() !== "";
  const needsPaymentMethod = !allHold || amountEntered;

  function selectStudent(student: IssueDeskStudent) {
    setStudentId(student.id);
    setError(null);
    setSuccessNote(null);
  }

  function linesFromStill(still: NonNullable<IssueDeskStudent["stillToReceive"]>) {
    return still.lines.map((owed) => {
      const item = items.find((i) => i.id === owed.itemId);
      const preferred =
        (owed.sizeLabel &&
        item?.sizes.some((s) => s.sizeLabel === owed.sizeLabel)
          ? owed.sizeLabel
          : null) ??
        item?.sizes.find((s) => stockFor(owed.itemId, s.sizeLabel) > 0)
          ?.sizeLabel ??
        item?.sizes[0]?.sizeLabel ??
        "M";
      return {
        itemId: owed.itemId,
        sizeLabel: preferred,
        qtyRequested: owed.qtyOwed,
        fulfil: true,
      };
    });
  }

  function fillWhatsLeft() {
    const still = selectedStudent?.stillToReceive;
    if (!still?.lines.length) return;
    setLines(linesFromStill(still));
    const anyPaid = still.lines.some(
      (l) => l.moneyStatus === "paid" || l.moneyStatus === "deposit",
    );
    if (anyPaid) setMoneyStatus("paid");
    setError(null);
  }

  useEffect(() => {
    if (prefillDone || !initialStudentId) return;
    const student = students.find((s) => s.id === initialStudentId);
    if (!student) return;
    setMode("existing");
    setStudentId(student.id);
    setQuery(student.admissionNo);
    const still = student.stillToReceive;
    if (still?.lines.length) {
      setLines(linesFromStill(still));
      const anyPaid = still.lines.some(
        (l) => l.moneyStatus === "paid" || l.moneyStatus === "deposit",
      );
      setMoneyStatus(anyPaid ? "paid" : "unpaid");
      if (!anyPaid) setPaymentMethod("");
    }
    setPrefillDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot deep-link prefill
  }, [initialStudentId, students, prefillDone]);

  async function rememberStudentOffline(student: IssueDeskStudent) {
    try {
      const snap = await loadIssueSnapshot(schoolId);
      if (!snap) return;
      if (snap.students.some((s) => s.id === student.id)) return;
      await saveIssueSnapshot({
        ...snap,
        students: [student, ...snap.students],
      });
    } catch {
      // offline cache is best-effort
    }
  }

  async function onAdmit() {
    setError(null);
    setQueuedNote(null);

    if (!navigator.onLine || cachedMode) {
      setError("New student entry needs a connection. Use Find student offline.");
      return;
    }

    const adm = admissionNo.trim();
    const name = fullName.trim();
    if (!adm || !name) {
      setError("Admission number and full name are required");
      return;
    }

    setAdmitPending(true);
    try {
      const formData = new FormData();
      formData.set("admissionNo", adm);
      formData.set("fullName", name);
      formData.set("schoolId", schoolId);
      if (className.trim()) formData.set("className", className.trim());
      if (parentName.trim()) formData.set("parentName", parentName.trim());
      if (parentPhone.trim()) formData.set("parentPhone", parentPhone.trim());

      const result = await addStudentAction({}, formData);
      if (result.error || !result.studentId) {
        const existing = students.find(
          (s) => s.admissionNo.toUpperCase() === adm.toUpperCase(),
        );
        if (existing) {
          selectStudent(existing);
          setError(null);
          return;
        }
        setError(result.error || "Could not save student");
        return;
      }

      const student: IssueDeskStudent = {
        id: result.studentId,
        admissionNo: result.admissionNo || adm.toUpperCase(),
        fullName: result.fullName || name,
        className: result.className ?? (className.trim() || null),
        parentName: result.parentName ?? (parentName.trim() || null),
        parentPhone: result.parentPhone ?? (parentPhone.trim() || null),
      };
      setStudents((prev) =>
        prev.some((s) => s.id === student.id) ? prev : [student, ...prev],
      );
      selectStudent(student);
      void rememberStudentOffline(student);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save student");
    } finally {
      setAdmitPending(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setQueuedNote(null);
    setSuccessNote(null);

    if (!studentId || !lines.length) {
      setError("Student and items are required");
      return;
    }

    const holdOnly = lines.every((l) => !l.fulfil);
    const amountRaw = paymentAmountKes.trim();
    const paymentAmountKesNum =
      amountRaw === "" ? undefined : Number(amountRaw);
    if (
      paymentAmountKesNum != null &&
      (!Number.isFinite(paymentAmountKesNum) || paymentAmountKesNum < 0)
    ) {
      setError("Payment amount must be a whole number in KES");
      return;
    }
    if ((!holdOnly || paymentAmountKesNum != null) && !paymentMethod) {
      setError("Payment method is required when issuing or recording payment");
      return;
    }

    const studentLabel = selectedStudent
      ? `${selectedStudent.fullName} (${selectedStudent.admissionNo})`
      : "Student";

    const payload = {
      studentId,
      schoolId,
      kitId: kitId || undefined,
      paymentMethod: paymentMethod || undefined,
      paymentReference: paymentReference.trim() || undefined,
      paymentAmountKes: paymentAmountKesNum,
      moneyStatus,
      lines,
      studentLabel,
    };

    const stockLines = lines.filter((l) => l.fulfil);

    setPending(true);
    try {
      async function queueOffline(note: string) {
        await enqueueIssue(payload);
        setBalances((prev) => applyIssueToBalances(prev, stockLines));
        void patchIssueSnapshotBalances(schoolId, stockLines);
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

      const payLabel = paymentMethod
        ? `${paymentMethod}${
            paymentReference.trim() ? ` · ${paymentReference.trim()}` : ""
          }`
        : moneyChip(moneyStatus);
      resetForm();
      setSuccessNote(
        `Saved for ${studentLabel}. No parent slip needed — ${
          paymentMethod ? `payment: ${payLabel}` : `status: ${payLabel}`
        }.`,
      );
      startTransition(() => router.refresh());
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

  const canSubmit = Boolean(
    studentId &&
      lines.length &&
      !pending &&
      (paymentMethod || (allHold && !amountEntered)),
  );

  return (
    <form onSubmit={onSubmit} className="page-stack pb-2">
      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">1</span>
          <div>
            <h2 className="card-title">Student</h2>
            <p className="card-subtitle">
              New admission at the uniform desk, or find an existing student
            </p>
          </div>
        </div>
        <div className="step-card-body form-stack">
          <div className="seg-control" role="tablist" aria-label="Student mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "new"}
              onClick={() => setMode("new")}
              className={`seg-control-item ${mode === "new" ? "is-active" : ""}`}
            >
              New student
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "existing"}
              onClick={() => setMode("existing")}
              className={`seg-control-item ${mode === "existing" ? "is-active" : ""}`}
            >
              Find student
            </button>
          </div>

          {mode === "new" ? (
            <div className="form-stack">
              <div className="form-grid cols-3">
                <div className="field-group">
                  <label className="field-label" htmlFor="issue-admission">
                    Admission no
                  </label>
                  <input
                    id="issue-admission"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void onAdmit();
                      }
                    }}
                    placeholder="e.g. GF-2026-0142"
                    autoComplete="off"
                    className="field"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="issue-fullname">
                    Full name
                  </label>
                  <input
                    id="issue-fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void onAdmit();
                      }
                    }}
                    placeholder="Student full name"
                    autoComplete="name"
                    className="field"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="issue-class">
                    Class
                  </label>
                  <input
                    id="issue-class"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void onAdmit();
                      }
                    }}
                    placeholder="e.g. Form 1A"
                    autoComplete="off"
                    className="field"
                  />
                </div>
              </div>
              <div className="form-grid cols-2">
                <div className="field-group">
                  <label className="field-label" htmlFor="issue-parent-name">
                    Parent / guardian name
                  </label>
                  <input
                    id="issue-parent-name"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Optional"
                    className="field"
                  />
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="issue-parent-phone">
                    Parent phone
                  </label>
                  <input
                    id="issue-parent-phone"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="e.g. 07…"
                    inputMode="tel"
                    className="field"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={admitPending || !online || cachedMode}
                onClick={() => void onAdmit()}
                className="btn btn-secondary"
              >
                {admitPending ? "Saving student…" : "Save & continue to kit"}
              </button>
              {(!online || cachedMode) && (
                <p className="field-hint">
                  Online required to key in a new student. Use Find student when
                  offline.
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="field-group">
                <label className="field-label" htmlFor="issue-find">
                  Search roster
                </label>
                <input
                  id="issue-find"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Admission number or name"
                  inputMode="search"
                  autoComplete="off"
                  className="field"
                />
              </div>
              <ul className="card-inset max-h-64 overflow-y-auto !p-0">
                {filtered.map((student) => {
                  const selected = studentId === student.id;
                  return (
                    <li
                      key={student.id}
                      className="border-b border-[var(--line)] last:border-b-0"
                    >
                      <button
                        type="button"
                        onClick={() => selectStudent(student)}
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
                            {student.className
                              ? ` · ${student.className}`
                              : ""}
                          </span>
                        </span>
                        <span className="flex flex-wrap gap-1">
                          {student.stillToReceive &&
                            student.stillToReceive.totalOwed > 0 && (
                              <span className="chip chip-warn">Still owed</span>
                            )}
                          {selected && (
                            <span className="chip chip-ok">Selected</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="px-3 py-4 text-sm text-[var(--muted)]">
                    No students found. Switch to New student to key them in.
                  </li>
                )}
              </ul>
            </>
          )}

          {selectedStudent && (
            <div className="space-y-2">
              <p className="text-sm text-[var(--accent)]">
                Issuing to {selectedStudent.fullName}
                {" · "}
                {selectedStudent.admissionNo}
                {selectedStudent.className
                  ? ` · ${selectedStudent.className}`
                  : ""}
              </p>
              {(selectedStudent.parentName ||
                selectedStudent.parentPhone) && (
                <p className="text-xs text-[var(--muted)]">
                  Parent:{" "}
                  {[selectedStudent.parentName, selectedStudent.parentPhone]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              {selectedStudent.stillToReceive &&
              selectedStudent.stillToReceive.totalOwed > 0 ? (
                <div className="card-inset border-[color-mix(in_srgb,var(--warn)_35%,var(--line))] bg-[var(--warn-soft)]">
                  <p className="text-sm font-semibold">
                    Kit status · {selectedStudent.stillToReceive.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Received vs still owed for this student’s open plan
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {selectedStudent.stillToReceive.lines.map((line) => {
                      const hold =
                        line.holdReason === "held_by_desk"
                          ? "Held at desk"
                          : line.holdReason === "stock_shortage"
                            ? "Stock short"
                            : null;
                      const size = line.sizeLabel
                        ? ` · size ${line.sizeLabel}`
                        : "";
                      return (
                        <li
                          key={line.itemId}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <span>
                            {line.qtyOwed}× {line.itemName}
                            {size}
                          </span>
                          <span className="chip chip-warn">Owed</span>
                          <span className="chip">
                            {moneyChip(line.moneyStatus)}
                          </span>
                          {hold && (
                            <span className="chip chip-warn">{hold}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    type="button"
                    onClick={fillWhatsLeft}
                    className="btn btn-primary mt-3"
                  >
                    Issue what’s left
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Tip: load a kit below. Tick Issue now or Hold on each line.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">2</span>
          <div className="min-w-0 flex-1">
            <h2 className="card-title">Kit / items</h2>
            <p className="card-subtitle">
              Load a kit (recommended) or add lines manually
            </p>
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
        <div className="step-card-body form-stack">
          {lines.map((line, index) => {
            const item = items.find((i) => i.id === line.itemId);
            const onHand = stockFor(line.itemId, line.sizeLabel);
            const shortage = Math.max(0, line.qtyRequested - onHand);
            return (
              <div
                key={`${line.itemId}-${index}`}
                className="card-inset form-stack"
              >
                <div className="field-group">
                  <label
                    className="field-label"
                    htmlFor={`issue-item-${index}`}
                  >
                    Item
                  </label>
                  <select
                    id={`issue-item-${index}`}
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
                </div>
                <div className="form-grid cols-2">
                  <div className="field-group">
                    <label
                      className="field-label"
                      htmlFor={`issue-size-${index}`}
                    >
                      Size
                    </label>
                    <select
                      id={`issue-size-${index}`}
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
                  </div>
                  <div className="field-group">
                    <label
                      className="field-label"
                      htmlFor={`issue-qty-${index}`}
                    >
                      Qty
                    </label>
                    <input
                      id={`issue-qty-${index}`}
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
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="field-check">
                    <input
                      type="checkbox"
                      checked={line.fulfil}
                      onChange={(e) =>
                        updateLine(index, { fulfil: e.target.checked })
                      }
                    />
                    <span>
                      <span className="field-check-title">Issue now</span>
                      <span className="field-check-sub">
                        Untick to Hold (still owed)
                      </span>
                    </span>
                  </label>
                  {line.fulfil ? (
                    <>
                      <span className="chip">On hand {onHand}</span>
                      {shortage > 0 ? (
                        <span className="chip chip-warn">
                          Shortage {shortage}
                        </span>
                      ) : (
                        <span className="chip chip-ok">Enough stock</span>
                      )}
                    </>
                  ) : (
                    <span className="chip chip-warn">Hold</span>
                  )}
                </div>
              </div>
            );
          })}
          {lines.length === 0 && (
            <p className="field-hint">Load a kit or add item lines to continue.</p>
          )}
          <button type="button" onClick={addLine} className="btn btn-secondary">
            Add item line
          </button>
        </div>
      </section>

      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">3</span>
          <div>
            <h2 className="card-title">Payment</h2>
            <p className="card-subtitle">
              {allHold && !amountEntered
                ? "Hold-only — payment method optional. Set money status for Still owed."
                : "How the parent paid — method, reference, optional amount (KES)"}
            </p>
          </div>
        </div>
        <div className="step-card-body form-grid cols-2">
          <div className="field-group">
            <label className="field-label" htmlFor="issue-pay-method">
              Method{needsPaymentMethod ? "" : " (optional)"}
            </label>
            <select
              id="issue-pay-method"
              value={paymentMethod}
              onChange={(e) => {
                const next = e.target.value as PayMethod | "";
                setPaymentMethod(next);
                if (next && moneyStatus === "unpaid") setMoneyStatus("paid");
                if (!next && allHold) setMoneyStatus("unpaid");
              }}
              className="field"
              required={needsPaymentMethod}
            >
              {!needsPaymentMethod && <option value="">None</option>}
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank">Bank</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="issue-money-status">
              Money status
            </label>
            <select
              id="issue-money-status"
              value={moneyStatus}
              onChange={(e) => setMoneyStatus(e.target.value as MoneyStatus)}
              className="field"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="deposit">Deposit</option>
              <option value="waived">Waived</option>
            </select>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="issue-pay-ref">
              Reference
            </label>
            <input
              id="issue-pay-ref"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Receipt no. or M-Pesa code"
              className="field"
              autoComplete="off"
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="issue-pay-amount">
              Amount (KES, optional)
            </label>
            <input
              id="issue-pay-amount"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={paymentAmountKes}
              onChange={(e) => setPaymentAmountKes(e.target.value)}
              placeholder="e.g. 4500"
              className="field"
            />
            <p className="field-hint">Used for end-of-day cash-up reports</p>
          </div>
        </div>
      </section>

      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {queuedNote && <p className="field-ok">{queuedNote}</p>}
      {successNote && <p className="field-ok">{successNote}</p>}

      <div className="sticky-actions no-print">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn-primary btn-block"
        >
          {pending
            ? "Saving…"
            : online && !cachedMode
              ? "Save issue"
              : "Queue issue offline"}
        </button>
      </div>
    </form>
  );
}
