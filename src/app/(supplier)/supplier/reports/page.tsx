import Link from "next/link";
import { format } from "date-fns";
import { PrintButton } from "@/components/print-button";
import { ReportPrintBanner } from "@/components/report-print-banner";
import { SupplierCampusEmptyState } from "@/components/supplier-campus-gate";
import { SupplierSchoolSelect } from "@/components/supplier-school-select";
import { canSupplierManage, requireSupplierUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import {
  listActorCampuses,
  pickCampus,
} from "@/modules/identity/supplier-campuses";
import { listStudentsStillOwed } from "@/modules/issue/outstanding";
import {
  listDeskCashUp,
  listPaidNotCollected,
} from "@/modules/issue/plan-reports";
import {
  listSchoolIssuedForSupplier,
  listSchoolStockForSupplier,
  supplierReportStats,
} from "@/modules/reports/supplier-reports";

type ReportView = "issued" | "stock" | "paid" | "cashup";

export default async function SupplierReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string; view?: string }>;
}) {
  const user = await requireSupplierUser();
  const { schoolId: schoolIdParam, view: viewParam } = await searchParams;
  const view: ReportView =
    viewParam === "stock" ||
    viewParam === "paid" ||
    viewParam === "cashup"
      ? viewParam
      : "issued";

  const campuses = await listActorCampuses(user);
  const selected = pickCampus(campuses, schoolIdParam);
  const isAdmin = canSupplierManage(user.role);

  if (!selected) {
    return <SupplierCampusEmptyState title="Reports" isAdmin={isAdmin} />;
  }

  const [stats, issued, balances, stillOwed, paidPending, cashUp] =
    await Promise.all([
      supplierReportStats({
        supplierId: user.supplierId,
        schoolId: selected.id,
      }),
      listSchoolIssuedForSupplier({
        supplierId: user.supplierId,
        schoolId: selected.id,
      }),
      listSchoolStockForSupplier({
        supplierId: user.supplierId,
        schoolId: selected.id,
      }),
      listStudentsStillOwed(selected.id, 5),
      listPaidNotCollected(selected.id, { take: 50 }),
      listDeskCashUp(selected.id, new Date()),
    ]);

  const schoolQs = `schoolId=${selected.id}`;
  const viewLabel =
    view === "stock"
      ? "Stock on hand"
      : view === "paid"
        ? "Paid not collected"
        : view === "cashup"
          ? "Cash-up today"
          : "Issued today";

  return (
    <div className="page-stack">
      <header className="page-header animate-rise no-print">
        <div className="page-header-main">
          <h1 className="page-title">Reports</h1>
          <p className="page-sub">
            Issued uniforms and campus stock
            {campuses.length === 1
              ? ` for ${selected.name}.`
              : " for your campuses."}{" "}
            Stock is view-only from this portal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {campuses.length === 1 && (
            <span className="chip chip-accent">{selected.code}</span>
          )}
          <PrintButton label="Print report" />
        </div>
      </header>

      {campuses.length > 1 && (
        <section className="card national-panel no-print">
          <div className="card-body">
            <SupplierSchoolSelect
              basePath="/supplier/reports"
              value={selected.id}
              schools={campuses}
            />
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-2 no-print">
        <Link
          href={`/supplier/reports?${schoolQs}&view=issued`}
          className={`btn ${view === "issued" ? "btn-primary" : "btn-secondary"}`}
        >
          Issued today
        </Link>
        <Link
          href={`/supplier/reports?${schoolQs}&view=stock`}
          className={`btn ${view === "stock" ? "btn-primary" : "btn-secondary"}`}
        >
          Stock on hand
        </Link>
        <Link
          href={`/supplier/reports?${schoolQs}&view=paid`}
          className={`btn ${view === "paid" ? "btn-primary" : "btn-secondary"}`}
        >
          Paid not collected
        </Link>
        <Link
          href={`/supplier/reports?${schoolQs}&view=cashup`}
          className={`btn ${view === "cashup" ? "btn-primary" : "btn-secondary"}`}
        >
          Cash-up
        </Link>
        <Link
          href={`/supplier/incomplete?${schoolQs}`}
          className="btn btn-ghost"
        >
          Still owed →
        </Link>
      </div>

      <div className="print-report print-sheet print-doc">
        <ReportPrintBanner
          title={`Supplier report · ${viewLabel}`}
          subtitle={`${user.supplierName ?? "Supplier"} · ${selected.name} (${selected.code})`}
        />

        <section className="section">
          <div className="section-label">{selected.name}</div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Issued today", value: stats.issuedToday },
              { label: "Still owed", value: stats.stillOwedPlans },
              { label: "Stock lines", value: stats.balanceLines },
              { label: "Low stock", value: stats.lowStock },
            ].map((card) => (
              <div key={card.label} className="stat-card">
                <div className="stat-label">{card.label}</div>
                <div className="stat-value mt-1 text-[var(--accent)]">
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {view === "issued" && (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">Issued today</h2>
                <p className="card-subtitle">
                  Who received what — payment method, reference, optional amount
                </p>
              </div>
              <span className="chip">{issued.length}</span>
            </div>
            <div className="card-body space-y-3">
              {issued.length === 0 && (
                <p className="text-sm text-[var(--muted)]">No issues today.</p>
              )}
              {issued.map((slip) => {
                const units = slip.lines.reduce((s, l) => s + l.qtyIssued, 0);
                return (
                  <Link
                    key={slip.id}
                    href={`/supplier/slips/${slip.id}`}
                    className="card-inset block no-underline text-inherit"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">
                          {slip.student.fullName}
                        </div>
                        <div className="text-xs text-[var(--muted)]">
                          {slip.student.admissionNo}
                          {slip.student.className
                            ? ` · ${slip.student.className}`
                            : ""}
                          {" · "}
                          {slip.slipNo}
                        </div>
                      </div>
                      <div className="text-right text-xs text-[var(--muted)]">
                        <div>{format(slip.issuedAt, "HH:mm")}</div>
                        <span
                          className={
                            slip.status === "voided"
                              ? "chip chip-warn"
                              : "chip chip-ok"
                          }
                        >
                          {slip.status}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-2 space-y-0.5 text-sm text-[var(--muted)]">
                      {slip.lines.map((line) => (
                        <li key={line.id}>
                          {line.qtyIssued}× {line.item.name} ({line.sizeLabel})
                          {line.shortageQty > 0
                            ? ` · short ${line.shortageQty}`
                            : ""}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-xs text-[var(--muted)]">
                      {units} unit{units === 1 ? "" : "s"} · {slip.issuedBy.name}
                      {slip.paymentMethod
                        ? ` · ${slip.paymentMethod}${
                            slip.paymentReference
                              ? ` ${slip.paymentReference}`
                              : ""
                          }`
                        : ""}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {view === "stock" && (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">Stock on hand</h2>
                <p className="card-subtitle">
                  Read-only campus balances
                </p>
              </div>
              <span className="chip">{balances.length}</span>
            </div>
            <div className="card-body-flush table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Size</th>
                    <th>On hand</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((row) => (
                    <tr key={row.id}>
                      <td className="font-medium">{row.item.name}</td>
                      <td className="text-[var(--muted)]">{row.item.sku}</td>
                      <td>{row.sizeLabel}</td>
                      <td
                        className={`font-semibold ${
                          row.qtyOnHand <= 5 ? "text-[var(--warn)]" : ""
                        }`}
                      >
                        {row.qtyOnHand}
                        {row.qtyOnHand <= 5 ? " · low" : ""}
                      </td>
                    </tr>
                  ))}
                  {balances.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-[var(--muted)]">
                        No stock balances yet for this school.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {view === "paid" && (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">Paid not collected</h2>
                <p className="card-subtitle">
                  Paid or deposit lines still owed — aging by plan open days
                </p>
              </div>
              <span className="chip chip-warn">{paidPending.length}</span>
            </div>
            <div className="card-body space-y-3">
              {paidPending.length === 0 && (
                <p className="text-sm text-[var(--muted)]">
                  No paid items waiting for collection.
                </p>
              )}
              {paidPending.map((row) => (
                <article key={row.planId} className="card-inset">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{row.student.fullName}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {row.student.admissionNo}
                        {row.student.className
                          ? ` · ${row.student.className}`
                          : ""}
                        {" · "}
                        {row.label} · {row.ageDays}d open
                      </div>
                      {(row.student.parentName ||
                        row.student.parentPhone) && (
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          Parent:{" "}
                          {[row.student.parentName, row.student.parentPhone]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      )}
                    </div>
                    <span className="chip chip-warn">
                      {row.totalOwed} owed
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {row.lines.map((line) => (
                      <li key={line.itemId}>
                        {line.qtyOwed}× {line.itemName}
                        {line.sizeLabel ? ` · size ${line.sizeLabel}` : ""}
                        {line.holdLabel ? ` · ${line.holdLabel}` : ""}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 no-print">
                    <Link
                      href={`/supplier/issue?schoolId=${selected.id}&studentId=${row.student.id}`}
                      className="btn btn-primary"
                    >
                      Go to Issue
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {view === "cashup" && (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">Cash-up today</h2>
                <p className="card-subtitle">
                  Desk payments recorded on issue slips (
                  {format(cashUp.day, "dd MMM yyyy")})
                </p>
              </div>
              <span className="chip">{cashUp.slipCount}</span>
            </div>
            <div className="card-body space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="stat-card">
                  <div className="stat-label">Slips with payment</div>
                  <div className="stat-value mt-1">{cashUp.slipCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">With amount</div>
                  <div className="stat-value mt-1">{cashUp.withAmountCount}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Total recorded</div>
                  <div className="stat-value mt-1 text-[var(--accent)]">
                    {formatMoney(cashUp.totalAmountCents)}
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm">
                {Object.entries(cashUp.byMethod).map(([method, row]) => (
                  <li
                    key={method}
                    className="flex justify-between gap-2 card-inset"
                  >
                    <span className="capitalize">{method}</span>
                    <span>
                      {row.count} slip{row.count === 1 ? "" : "s"}
                      {row.amountCents
                        ? ` · ${formatMoney(row.amountCents)}`
                        : ""}
                    </span>
                  </li>
                ))}
                {cashUp.slipCount === 0 && (
                  <li className="text-[var(--muted)]">No payments today.</li>
                )}
              </ul>
            </div>
          </section>
        )}

        {stillOwed.length > 0 && view === "issued" && (
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">
                  Still to receive (sample)
                </h2>
                <p className="card-subtitle">Incomplete kits at this school</p>
              </div>
              <Link
                href={`/supplier/incomplete?${schoolQs}`}
                className="btn btn-ghost no-print"
              >
                Full list
              </Link>
            </div>
            <div className="card-body space-y-2 text-sm">
              {stillOwed.map((row) => (
                <div key={row.planId} className="flex justify-between gap-2">
                  <span>
                    {row.student.fullName}{" "}
                    <span className="text-[var(--muted)]">
                      ({row.student.admissionNo})
                    </span>
                  </span>
                  <span className="chip chip-warn">{row.totalOwed} left</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
