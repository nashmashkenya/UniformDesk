"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  holdReasonLabel,
  moneyStatusLabel,
} from "@/modules/issue/plan-labels";

export type StillOwedRow = {
  planId: string;
  label: string;
  totalOwed: number;
  openedAt?: Date | string;
  lines: {
    itemId: string;
    itemName: string;
    qtyOwed: number;
    sizeLabel?: string | null;
    moneyStatus?: string;
    holdReason?: string | null;
  }[];
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    className: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
  };
};

type FilterId = "all" | "ready" | "nostock" | "later";

function ageDays(openedAt?: Date | string) {
  if (!openedAt) return null;
  const from = typeof openedAt === "string" ? new Date(openedAt) : openedAt;
  const ms = Date.now() - from.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

function matchesFilter(row: StillOwedRow, filter: FilterId) {
  if (filter === "all") return true;
  const reasons = row.lines.map((l) => l.holdReason);
  if (filter === "nostock") return reasons.includes("stock_shortage");
  if (filter === "later") return reasons.includes("held_by_desk");
  return reasons.some((r) => r !== "stock_shortage");
}

export function StillOwedList({
  rows,
  issueHref,
  emptyHint,
}: {
  rows: StillOwedRow[];
  issueHref: (studentId: string) => string;
  emptyHint?: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!matchesFilter(row, filter)) return false;
      if (!q) return true;
      const hay = [
        row.student.fullName,
        row.student.admissionNo,
        row.student.className,
        row.student.parentName,
        row.student.parentPhone,
        row.label,
        ...row.lines.map((l) => l.itemName),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, query, filter]);

  const counts = {
    all: rows.length,
    ready: rows.filter((r) => matchesFilter(r, "ready")).length,
    nostock: rows.filter((r) => matchesFilter(r, "nostock")).length,
    later: rows.filter((r) => matchesFilter(r, "later")).length,
  };

  if (!rows.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {emptyHint ?? "Every student on this campus has received their full uniform."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="no-print space-y-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, admission no., or parent"
          className="field"
          inputMode="search"
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["all", "All", counts.all],
              ["ready", "Can give now", counts.ready],
              ["later", "Collect later", counts.later],
              ["nostock", "No stock", counts.nostock],
            ] as const
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              className={`chip ${filter === id ? "chip-accent" : ""}`}
              onClick={() => setFilter(id)}
            >
              {label} {n}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">
          No students match this search.
        </p>
      ) : (
        filtered.map((row) => {
          const age = ageDays(row.openedAt);
          return (
            <article key={row.planId} className="card-inset">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{row.student.fullName}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {row.student.admissionNo}
                    {row.student.className ? ` · ${row.student.className}` : ""}
                    {age != null && age > 0 ? ` · waiting ${age}d` : ""}
                  </div>
                  {(row.student.parentName || row.student.parentPhone) && (
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {[row.student.parentName, row.student.parentPhone]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  )}
                </div>
                <span className="chip chip-warn">
                  {row.totalOwed} item{row.totalOwed === 1 ? "" : "s"} left
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {row.lines.map((line) => {
                  const hold = holdReasonLabel(line.holdReason);
                  const money = moneyStatusLabel(line.moneyStatus);
                  const size = line.sizeLabel ? ` · ${line.sizeLabel}` : "";
                  return (
                    <li
                      key={line.itemId}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <span>
                        {line.qtyOwed}× {line.itemName}
                        {size}
                      </span>
                      <span className="chip">{money}</span>
                      {hold && <span className="chip chip-warn">{hold}</span>}
                    </li>
                  );
                })}
              </ul>
              <div className="mt-3 no-print">
                <Link
                  href={issueHref(row.student.id)}
                  className="btn btn-primary"
                >
                  Finish
                </Link>
              </div>
            </article>
          );
        })
      )}
    </div>
  );
}
