import Link from "next/link";
import { format } from "date-fns";
import { AuditExportForm } from "@/components/audit-export-form";
import { PrintButton } from "@/components/print-button";
import { ReportPrintBanner } from "@/components/report-print-banner";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { issuedToday, shortageReport } from "@/modules/reports/reports";

export default async function ReportsPage() {
  const user = await requireSchoolUser();
  const [today, shortages] = await Promise.all([
    issuedToday(user.schoolId),
    shortageReport(user.schoolId),
  ]);
  const canExport = canWrite(user.role) || user.role === "auditor";

  return (
    <div className="page-stack">
      <header className="page-header animate-rise no-print">
        <div className="page-header-main">
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">
            Issued today, shortages, stock, and still to receive.{" "}
            <Link href="/incomplete" className="text-[var(--accent)]">
              To finish →
            </Link>
            {" · "}
            <Link href="/stock" className="text-[var(--accent)]">
              Stock take →
            </Link>
          </p>
        </div>
        <PrintButton label="Print report" />
      </header>

      <div className="print-report print-sheet print-doc">
        <ReportPrintBanner
          title="Campus reports"
          subtitle={`${user.schoolName ?? "School"} · issued today & shortages`}
        />

        {canExport && (
          <section className="card animate-rise no-print">
            <div className="card-header">
              <div>
                <h2 className="card-title">Audit export</h2>
                <p className="card-subtitle">
                  CSV of issue lines, shortages, voids, and public tokens
                </p>
              </div>
            </div>
            <div className="card-body">
              <AuditExportForm />
            </div>
          </section>
        )}

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Issued today</h2>
              <p className="card-subtitle">
                Issue records since midnight (payment method shown when
                recorded)
              </p>
            </div>
            <span className="chip chip-accent">{today.length}</span>
          </div>
          <div className="card-body-flush">
            {today.map((slip) => (
              <Link
                key={slip.id}
                href={`/slips/${slip.id}`}
                className="list-row"
              >
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {slip.student.fullName}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {slip.slipNo}
                    {slip.paymentMethod
                      ? ` · ${slip.paymentMethod}${
                          slip.paymentReference
                            ? ` ${slip.paymentReference}`
                            : ""
                        }`
                      : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  {format(slip.issuedAt, "HH:mm")}
                  <span
                    className={
                      slip.status === "voided"
                        ? "chip chip-warn"
                        : "chip chip-ok"
                    }
                  >
                    {slip.status}
                  </span>
                </span>
              </Link>
            ))}
            {today.length === 0 && (
              <p className="px-3.5 py-8 text-sm text-[var(--muted)]">
                No issues today.
              </p>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Shortage report</h2>
              <p className="card-subtitle">
                Requested items that could not be fully issued
              </p>
            </div>
            <span className="chip chip-warn">{shortages.length}</span>
          </div>

          <div className="grid gap-3 p-3.5 sm:hidden print:hidden">
            {shortages.map((row) => (
              <Link
                key={row.id}
                href={`/slips/${row.slip.id}`}
                className="card-inset block no-underline text-inherit"
              >
                <div className="font-semibold">{row.slip.student.fullName}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">
                  {row.item.name} / {row.sizeLabel}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[var(--muted)]">
                    {row.slip.slipNo}
                  </span>
                  <span className="chip chip-warn">-{row.shortageQty}</span>
                </div>
              </Link>
            ))}
            {shortages.length === 0 && (
              <p className="py-5 text-sm text-[var(--muted)]">
                No shortages recorded.
              </p>
            )}
          </div>

          <div className="table-wrap hidden sm:block print:block">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Slip</th>
                  <th>Student</th>
                  <th>Item</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {shortages.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/slips/${row.slip.id}`}
                        className="font-medium text-[var(--accent)] underline"
                      >
                        {row.slip.slipNo}
                      </Link>
                    </td>
                    <td>{row.slip.student.fullName}</td>
                    <td>
                      {row.item.name} / {row.sizeLabel}
                    </td>
                    <td className="font-semibold text-[var(--warn)]">
                      {row.shortageQty}
                    </td>
                  </tr>
                ))}
                {shortages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-[var(--muted)]">
                      No shortages recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
