"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { addStudentAction } from "@/app/actions/students";
import { StudentUniformCard } from "@/components/student-uniform-card";
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
import {
  buildStandardUniformRows,
  kesFromCents,
  leftoverAlreadyPaidOnSet,
  selectedGiveNowCents,
} from "@/modules/issue/uniform-set";

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
  finishMode = false,
  returnTo,
}: {
  schoolId: string;
  students: IssueDeskStudent[];
  kits: IssueDeskKit[];
  items: IssueDeskItem[];
  balances: IssueDeskBalance[];
  cachedMode?: boolean;
  /** Deep-link from To finish */
  initialStudentId?: string;
  /** Skip student/kit search — leftover items only */
  finishMode?: boolean;
  /** After save, go back to the To finish list */
  returnTo?: string;
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

  function preferredSize(itemId: string, wanted?: string | null) {
    const item = items.find((i) => i.id === itemId);
    return (
      (wanted && item?.sizes.some((s) => s.sizeLabel === wanted)
        ? wanted
        : null) ??
      item?.sizes.find((s) => stockFor(itemId, s.sizeLabel) > 0)?.sizeLabel ??
      item?.sizes[0]?.sizeLabel ??
      "M"
    );
  }

  function linesFromKit(kit: IssueDeskKit): Line[] {
    return kit.lines.map((line) => {
      const sizeLabel = preferredSize(line.itemId);
      return {
        itemId: line.itemId,
        sizeLabel,
        qtyRequested: line.qtyDefault,
        fulfil: true,
      };
    });
  }

  function linesFromUniformSet(
    set: NonNullable<IssueDeskStudent["uniformSet"]>,
  ): Line[] {
    return set.lines
      .filter((l) => l.qtyLeft > 0)
      .map((owed) => {
        const sizeLabel = preferredSize(owed.itemId, owed.sizeLabel);
        return {
          itemId: owed.itemId,
          sizeLabel,
          qtyRequested: owed.qtyLeft,
          fulfil: stockFor(owed.itemId, sizeLabel) >= owed.qtyLeft,
        };
      });
  }

  function applyUniformForStudent(student: IssueDeskStudent) {
    const set = student.uniformSet;
    if (set?.lines.length) {
      if (set.kitId) setKitId(set.kitId);
      setLines(linesFromUniformSet(set));
      const leftover = set.lines.filter((l) => l.qtyLeft > 0);
      const anyPaid = leftover.some(
        (l) => l.moneyStatus === "paid" || l.moneyStatus === "deposit",
      );
      if (anyPaid) {
        setMoneyStatus("paid");
        setPaymentMethod("cash");
      } else if (leftover.length) {
        setMoneyStatus("unpaid");
      }
      return;
    }
    if (student.stillToReceive?.lines.length) {
      setLines(linesFromStill(student.stillToReceive));
      const anyPaid = student.stillToReceive.lines.some(
        (l) => l.moneyStatus === "paid" || l.moneyStatus === "deposit",
      );
      if (anyPaid) {
        setMoneyStatus("paid");
        setPaymentMethod("cash");
      }
    }
  }

  function applyKit(id: string) {
    setKitId(id);
    if (selectedStudent?.uniformSet?.lines.length) {
      setLines(linesFromUniformSet(selectedStudent.uniformSet));
      return;
    }
    const kit = kits.find((k) => k.id === id);
    if (!kit) return;
    setLines(linesFromKit(kit));
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
  const leftoverAlreadyPaid =
    moneyStatus === "paid" ||
    moneyStatus === "deposit" ||
    moneyStatus === "waived";
  const needsPaymentMethod =
    (!allHold && !leftoverAlreadyPaid) || amountEntered;

  function selectStudent(student: IssueDeskStudent) {
    setStudentId(student.id);
    setError(null);
    setSuccessNote(null);
    applyUniformForStudent(student);
  }

  function linesFromStill(still: NonNullable<IssueDeskStudent["stillToReceive"]>) {
    return still.lines.map((owed) => {
      const sizeLabel = preferredSize(owed.itemId, owed.sizeLabel);
      return {
        itemId: owed.itemId,
        sizeLabel,
        qtyRequested: owed.qtyOwed,
        fulfil: stockFor(owed.itemId, sizeLabel) >= owed.qtyOwed,
      };
    });
  }

  function fillWhatsLeft() {
    if (!selectedStudent) return;
    applyUniformForStudent(selectedStudent);
    setError(null);
  }

  useEffect(() => {
    if (prefillDone || !initialStudentId) return;
    const student = students.find((s) => s.id === initialStudentId);
    if (!student) return;
    setMode("existing");
    setStudentId(student.id);
    setQuery(student.admissionNo);
    applyUniformForStudent(student);
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
        if (returnTo) {
          startTransition(() => router.push(returnTo));
          return;
        }
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
      if (returnTo) {
        startTransition(() => router.push(returnTo));
        return;
      }
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
          if (returnTo) {
            startTransition(() => router.push(returnTo));
            return;
          }
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

  useEffect(() => {
    if (needsPaymentMethod && !paymentMethod) setPaymentMethod("cash");
  }, [needsPaymentMethod, paymentMethod]);

  const selectedKit = kits.find((k) => k.id === kitId);
  const cardRows = useMemo(
    () =>
      buildStandardUniformRows({
        uniformSet: selectedStudent?.uniformSet,
        kit: selectedKit,
        items,
        lines,
        stockFor,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stockFor is stable enough per render
    [selectedStudent?.uniformSet, selectedKit, items, lines, balances],
  );
  const cardItemIds = useMemo(
    () => new Set(cardRows.map((r) => r.itemId)),
    [cardRows],
  );
  const extraLineIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => !cardItemIds.has(line.itemId));
  const selectedCents = selectedGiveNowCents(lines, items);
  const planAlreadyPaid =
    leftoverAlreadyPaidOnSet(selectedStudent?.uniformSet?.lines) ||
    leftoverAlreadyPaidOnSet(
      selectedStudent?.stillToReceive?.lines.map((l) => ({
        qtyLeft: l.qtyOwed,
        moneyStatus: l.moneyStatus,
      })),
    );

  useEffect(() => {
    if (planAlreadyPaid) return;
    const kes = kesFromCents(selectedCents);
    setPaymentAmountKes(kes > 0 ? String(kes) : "");
  }, [selectedCents, planAlreadyPaid]);

  function onToggleGive(itemId: string, give: boolean) {
    setLines((prev) =>
      prev.map((line) =>
        line.itemId === itemId ? { ...line, fulfil: give } : line,
      ),
    );
  }

  function onCardSizeChange(itemId: string, sizeLabel: string) {
    setLines((prev) =>
      prev.map((line) =>
        line.itemId === itemId ? { ...line, sizeLabel } : line,
      ),
    );
  }

  const canSubmit = Boolean(studentId && lines.length && !pending);
  const submitHint = !studentId
    ? finishMode
      ? "Student is missing — go back to the list."
      : "Save or find a student first."
    : !lines.length
      ? finishMode
        ? "No leftover items loaded — go back to To finish."
        : "Load a kit or add items."
      : null;

  return (
    <form onSubmit={onSubmit} className="page-stack pb-2">
      {finishMode ? (
        <section className="card-inset border-[color-mix(in_srgb,var(--accent)_35%,var(--line))]">
          <p className="text-sm font-semibold">
            Finish uniform
            {selectedStudent
              ? ` · ${selectedStudent.fullName}`
              : ""}
          </p>
          {selectedStudent && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {selectedStudent.admissionNo}
              {selectedStudent.className
                ? ` · ${selectedStudent.className}`
                : ""}
              {(selectedStudent.parentName || selectedStudent.parentPhone)
                ? ` · ${[selectedStudent.parentName, selectedStudent.parentPhone].filter(Boolean).join(" · ")}`
                : ""}
            </p>
          )}
          <p className="mt-2 text-sm">
            Standard uniform card: given items and what is still not given.
            Tick Give now on leftover items and the price fills in.
          </p>
          {returnTo && (
            <a href={returnTo} className="btn btn-ghost mt-3">
              Back to list
            </a>
          )}
        </section>
      ) : (
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
                              <span className="chip chip-warn">To finish</span>
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
                    Not finished · {selectedStudent.stillToReceive.label}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Given and leftover items are on the uniform card below.
                    Tick Give now to add the price.
                  </p>
                  <button
                    type="button"
                    onClick={fillWhatsLeft}
                    className="btn btn-secondary mt-3"
                  >
                    Reload leftover items
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[var(--muted)]">
                  Load a kit below. Tick Give now and the price fills in.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
      )}

      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">2</span>
          <div className="min-w-0 flex-1">
            <h2 className="card-title">Student uniform</h2>
            <p className="card-subtitle">
              {finishMode
                ? "Given vs not given. Tick leftover items — price fills in."
                : "Load a kit. Tick Give now on items to issue — price fills in."}
            </p>
          </div>
          {!finishMode && !selectedStudent?.uniformSet && (
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
          )}
        </div>
        <div className="step-card-body form-stack">
          {cardRows.length > 0 && (
            <StudentUniformCard
              title={
                selectedStudent?.uniformSet?.label ||
                selectedKit?.name ||
                "Uniform set"
              }
              rows={cardRows}
              onToggleGive={onToggleGive}
              onSizeChange={onCardSizeChange}
              selectedCents={selectedCents}
            />
          )}
          {extraLineIndexes.map(({ line, index }) => {
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
                    Extra item
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
                      <span className="field-check-title">Give now</span>
                      <span className="field-check-sub">
                        Untick to keep waiting
                      </span>
                    </span>
                  </label>
                  {item?.unitPriceCents ? (
                    <span className={`chip ${line.fulfil ? "chip-accent" : ""}`}>
                      {line.fulfil
                        ? `KES ${kesFromCents(item.unitPriceCents * line.qtyRequested)}`
                        : `KES ${kesFromCents(item.unitPriceCents)} each`}
                    </span>
                  ) : null}
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
                    <span className="chip chip-warn">Waiting</span>
                  )}
                </div>
              </div>
            );
          })}
          {lines.length === 0 && cardRows.length === 0 && (
            <p className="field-hint">
              {finishMode
                ? "No leftover items loaded. Go back to the list."
                : "Load a kit or add item lines to continue."}
            </p>
          )}
          {!finishMode && (
          <button type="button" onClick={addLine} className="btn btn-secondary">
            Add extra item
          </button>
          )}
        </div>
      </section>

      <section className="step-card">
        <div className="step-card-head">
          <span className="step-index">3</span>
          <div>
            <h2 className="card-title">Payment</h2>
            <p className="card-subtitle">
              {leftoverAlreadyPaid
                ? "Already marked paid — you can give the items now."
                : allHold && !amountEntered
                ? "Nothing is leaving stock — payment is optional."
                : "Amount fills from Give now items. Method, reference, and status as usual."}
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
              Amount (KES)
            </label>
            <input
              id="issue-pay-amount"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={paymentAmountKes}
              onChange={(e) => setPaymentAmountKes(e.target.value)}
              placeholder="Filled from Give now"
              className="field"
            />
            <p className="field-hint">
              Fills when you tick leftover items. You can still edit it.
            </p>
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
        {submitHint && (
          <p className="field-hint mb-2" role="status">
            {submitHint}
          </p>
        )}
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn btn-primary btn-block"
        >
            {pending
            ? "Saving…"
            : finishMode
              ? "Give remaining items"
              : online && !cachedMode
              ? "Save issue"
              : "Queue issue offline"}
        </button>
      </div>
    </form>
  );
}
