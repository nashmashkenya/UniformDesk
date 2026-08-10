import Link from "next/link";
import {
  holdReasonLabel,
  moneyStatusLabel,
} from "@/modules/issue/outstanding";

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

function ageDays(openedAt?: Date | string) {
  if (!openedAt) return null;
  const from = typeof openedAt === "string" ? new Date(openedAt) : openedAt;
  const ms = Date.now() - from.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export function StillOwedList({
  rows,
  issueHref,
  emptyHint,
}: {
  rows: StillOwedRow[];
  /** Build issue URL for a student, e.g. (id) => `/issue?studentId=…` */
  issueHref: (studentId: string) => string;
  emptyHint?: string;
}) {
  if (!rows.length) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {emptyHint ?? "Everyone on the list has received their full set."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const age = ageDays(row.openedAt);
        return (
          <article key={row.planId} className="card-inset">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-semibold">{row.student.fullName}</div>
                <div className="text-xs text-[var(--muted)]">
                  {row.student.admissionNo}
                  {row.student.className ? ` · ${row.student.className}` : ""}
                  {" · "}
                  {row.label}
                  {age != null ? ` · ${age}d open` : ""}
                </div>
                {(row.student.parentName || row.student.parentPhone) && (
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Parent:{" "}
                    {[row.student.parentName, row.student.parentPhone]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
              </div>
              <span className="chip chip-warn">
                {row.totalOwed} still to receive
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {row.lines.map((line) => {
                const hold = holdReasonLabel(line.holdReason);
                const money = moneyStatusLabel(line.moneyStatus);
                const size = line.sizeLabel ? ` · size ${line.sizeLabel}` : "";
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
                Issue what’s left
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}
