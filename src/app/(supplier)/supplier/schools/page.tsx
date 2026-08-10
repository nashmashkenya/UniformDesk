import Link from "next/link";
import { format } from "date-fns";
import {
  CreateSchoolForm,
  LinkSchoolForm,
} from "@/components/branding-form";
import { StatusPill } from "@/components/status-pill";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { listSchoolPortfolio } from "@/modules/supply/portfolio";

export default async function SupplierSchoolsPage() {
  const user = await requireSupplierAdmin();
  const portfolio = await listSchoolPortfolio(user.supplierId);
  const canLink = true;

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Schools</h1>
        <p className="page-sub">
          Create or link schools, set each school’s catalogue &amp; kits, then
          co-issue and supply.
        </p>
      </section>

      {canLink && (
        <>
          <section className="card national-panel">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">Create a school</h2>
                <p className="card-subtitle">
                  New school code, auto-linked — your team operates the desk
                </p>
              </div>
            </div>
            <div className="card-body">
              <CreateSchoolForm />
            </div>
          </section>

          <section className="card national-panel">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">Link an existing school</h2>
                <p className="card-subtitle">
                  Use a code that already exists (e.g. GFS, RVA)
                </p>
              </div>
            </div>
            <div className="card-body">
              <LinkSchoolForm />
            </div>
          </section>
        </>
      )}

      <section className="grid gap-3 lg:grid-cols-2">
        {portfolio.map((row) => (
          <article key={row.linkId} className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title text-base">{row.school.name}</h2>
                <p className="card-subtitle">{row.school.code}</p>
              </div>
            </div>
            <div className="card-body space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="card-inset">
                  <div className="stat-label">Orders</div>
                  <div className="text-lg font-semibold text-[var(--accent)]">
                    {row.openOrders}
                  </div>
                </div>
                <div className="card-inset">
                  <div className="stat-label">Deliveries</div>
                  <div className="text-lg font-semibold text-[var(--accent)]">
                    {row.openDeliveries}
                  </div>
                </div>
                <div className="card-inset">
                  <div className="stat-label">Unpaid</div>
                  <div className="text-lg font-semibold text-[var(--accent)]">
                    {row.unpaidInvoices}
                  </div>
                </div>
              </div>

              <div className="text-xs text-[var(--muted)]">
                {row.lastDelivery ? (
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      Last DN {row.lastDelivery.deliveryNo} ·{" "}
                      {format(row.lastDelivery.createdAt, "dd MMM")}
                    </span>
                    <StatusPill status={row.lastDelivery.status} />
                  </div>
                ) : (
                  <span>No deliveries yet</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/supplier/schools/${row.school.id}/catalog`}
                  className="btn btn-primary"
                >
                  Catalogue & kits
                </Link>
                <Link
                  href={`/supplier/issue?schoolId=${row.school.id}`}
                  className="btn btn-secondary"
                >
                  Co-issue
                </Link>
                <Link
                  href={`/supplier/orders?schoolId=${row.school.id}`}
                  className="btn btn-ghost"
                >
                  Orders
                </Link>
                <Link
                  href={`/supplier/deliveries?schoolId=${row.school.id}`}
                  className="btn btn-ghost"
                >
                  Deliveries
                </Link>
                <Link
                  href={`/supplier/invoices?schoolId=${row.school.id}`}
                  className="btn btn-ghost"
                >
                  Invoices
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>

      {!portfolio.length && (
        <p className="text-sm text-[var(--muted)]">No schools linked yet.</p>
      )}
    </div>
  );
}
