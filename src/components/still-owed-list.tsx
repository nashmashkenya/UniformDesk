import Link from "next/link";

export type StillOwedRow = {
  planId: string;
  label: string;
  totalOwed: number;
  lines: { itemId: string; itemName: string; qtyOwed: number }[];
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    className: string | null;
  };
};

export function StillOwedList({
  rows,
  issueHref,
  emptyHint,
}: {
  rows: StillOwedRow[];
  /** Build issue URL for a student, e.g. (id) => `/issue` or supplier link */
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
      {rows.map((row) => (
        <article key={row.planId} className="card-inset">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="font-semibold">{row.student.fullName}</div>
              <div className="text-xs text-[var(--muted)]">
                {row.student.admissionNo}
                {row.student.className ? ` · ${row.student.className}` : ""}
                {" · "}
                {row.label}
              </div>
            </div>
            <span className="chip chip-warn">
              {row.totalOwed} still to receive
            </span>
          </div>
          <ul className="mt-2 space-y-1 text-sm">
            {row.lines.map((line) => (
              <li key={line.itemId}>
                {line.qtyOwed}× {line.itemName}
              </li>
            ))}
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
      ))}
    </div>
  );
}
