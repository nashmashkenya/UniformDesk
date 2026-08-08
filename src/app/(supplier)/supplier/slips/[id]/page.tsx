import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSupplierUser } from "@/lib/auth";
import {
  assertCanViewSchoolSlip,
  getSlipForViewer,
  issuerAffiliation,
} from "@/modules/issue/access";

export default async function SupplierSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSupplierUser();
  const { id } = await params;
  const slip = await getSlipForViewer(id);
  if (!slip) notFound();

  try {
    await assertCanViewSchoolSlip(user, slip.schoolId);
  } catch {
    notFound();
  }

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header no-print">
        <div className="page-header-main">
          <p className="text-xs text-[var(--muted)]">
            <Link href="/supplier/issue" className="text-[var(--accent)]">
              Co-issue
            </Link>
            {" · "}
            {slip.school.name}
          </p>
          <h1 className="page-title">Issue record</h1>
          <p className="page-sub">
            {slip.slipNo} · staff record (no parent slip)
          </p>
        </div>
      </header>

      <article className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">{slip.school.name}</h2>
            <p className="card-subtitle">{slip.slipNo}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--muted)]">
              {format(slip.issuedAt, "dd MMM yyyy HH:mm")}
            </div>
            <div className="mt-2">
              <span
                className={
                  slip.status === "voided" ? "chip chip-warn" : "chip chip-ok"
                }
              >
                {slip.status}
              </span>
            </div>
          </div>
        </div>

        <div className="card-body space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="card-inset">
              <div className="section-label">Student</div>
              <div className="mt-1 font-semibold">{slip.student.fullName}</div>
              <div className="text-[var(--muted)]">
                {slip.student.admissionNo}
              </div>
              <div className="text-[var(--muted)]">
                {slip.student.className}
              </div>
            </div>
            <div className="card-inset">
              <div className="section-label">Issued by</div>
              <div className="mt-1 font-semibold">
                {issuerAffiliation(slip.issuedBy)}
              </div>
              <div className="text-[var(--muted)]">
                {slip.paymentMethod
                  ? `Paid: ${slip.paymentMethod}${
                      slip.paymentReference
                        ? ` · ${slip.paymentReference}`
                        : ""
                    }`
                  : "Payment not recorded"}
              </div>
            </div>
          </div>

          <div className="table-wrap overflow-hidden rounded-[6px] border border-[var(--line)]">
            <table className="data-table min-w-0">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Size</th>
                  <th>Requested</th>
                  <th>Issued</th>
                  <th>Shortage</th>
                </tr>
              </thead>
              <tbody>
                {slip.lines.map((line) => (
                  <tr key={line.id}>
                    <td>{line.item.name}</td>
                    <td>{line.sizeLabel}</td>
                    <td>{line.qtyRequested}</td>
                    <td>{line.qtyIssued}</td>
                    <td className="text-[var(--warn)]">{line.shortageQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </div>
  );
}
