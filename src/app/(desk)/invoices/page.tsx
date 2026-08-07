import Link from "next/link";
import { format } from "date-fns";
import { StatusPill } from "@/components/status-pill";
import { formatMoney } from "@/lib/money";
import { requireSchoolUser } from "@/lib/auth";
import { listSchoolInvoices } from "@/modules/supply/invoices";

export default async function SchoolInvoicesPage() {
  const user = await requireSchoolUser();
  const invoices = await listSchoolInvoices(user.schoolId);

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Invoices</h1>
        <p className="page-sub">Supplier invoices against deliveries.</p>
      </section>

      <section className="card">
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Supplier</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Issued</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      {inv.invoiceNo}
                    </Link>
                  </td>
                  <td>{inv.supplier.name}</td>
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
          {!invoices.length && (
            <p className="text-sm text-[var(--muted)]">No invoices yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
