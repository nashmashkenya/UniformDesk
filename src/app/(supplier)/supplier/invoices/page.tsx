import Link from "next/link";
import { format } from "date-fns";
import { StatusPill } from "@/components/status-pill";
import { formatMoney } from "@/lib/money";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { listSupplierInvoices } from "@/modules/supply/invoices";
import { listLinkedSchools } from "@/modules/supply/products";

export default async function SupplierInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string }>;
}) {
  const user = await requireSupplierAdmin();
  const { schoolId } = await searchParams;
  const [invoices, links] = await Promise.all([
    listSupplierInvoices(user.supplierId),
    listLinkedSchools(user.supplierId),
  ]);
  const filtered = schoolId
    ? invoices.filter((i) => i.schoolId === schoolId)
    : invoices;
  const filterSchool = links.find((l) => l.schoolId === schoolId)?.school;

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Invoices</h1>
        <p className="page-sub">
          {filterSchool
            ? `Filtered · ${filterSchool.name}`
            : "Created from deliveries. Mark paid when settled."}
          {filterSchool && (
            <>
              {" · "}
              <Link href="/supplier/invoices" className="text-[var(--accent)]">
                Clear filter
              </Link>
            </>
          )}
        </p>
      </section>

      <section className="card">
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>School</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issued</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link
                      href={`/supplier/invoices/${inv.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      {inv.invoiceNo}
                    </Link>
                  </td>
                  <td>{inv.school.name}</td>
                  <td>{formatMoney(inv.amountCents)}</td>
                  <td>
                    <StatusPill status={inv.status} />
                  </td>
                  <td>
                    {inv.issuedAt
                      ? format(inv.issuedAt, "dd MMM yyyy")
                      : format(inv.createdAt, "dd MMM yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && (
            <p className="text-sm text-[var(--muted)]">
              No invoices yet. Create one from a delivery.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
