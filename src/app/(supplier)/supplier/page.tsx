import Link from "next/link";
import { NoticesList } from "@/components/notices-list";
import { requireSupplierUser } from "@/lib/auth";
import { listSupplierNotifications } from "@/modules/reports/notifications";
import { getSupplierBrand } from "@/modules/supply/branding";
import { listSupplierDeliveries } from "@/modules/supply/deliveries";
import { listSupplierInvoices } from "@/modules/supply/invoices";
import { listSupplierOrders } from "@/modules/supply/orders";
import { listSchoolPortfolio } from "@/modules/supply/portfolio";

export default async function SupplierHomePage() {
  const user = await requireSupplierUser();
  const [orders, deliveries, invoices, portfolio, brand, notices] =
    await Promise.all([
      listSupplierOrders(user.supplierId),
      listSupplierDeliveries(user.supplierId),
      listSupplierInvoices(user.supplierId),
      listSchoolPortfolio(user.supplierId),
      getSupplierBrand(user.supplierId),
      listSupplierNotifications(user.supplierId, { take: 5 }),
    ]);

  const openDeliveries = deliveries.filter(
    (d) => d.status === "packed" || d.status === "in_transit",
  ).length;
  const unpaid = invoices.filter((i) => i.status === "issued").length;
  const displayName = brand?.brandName ?? user.supplierName;

  return (
    <div className="page-stack">
      <section className="desk-hero animate-rise">
        <p className="text-xs font-semibold text-[var(--hero-muted)]">
          {displayName}
        </p>
        <h1 className="mt-1 text-[22px] font-semibold leading-7 sm:text-[28px] sm:leading-9">
          Multi-school supply
        </h1>
        <p className="page-sub mt-1 max-w-lg">
          Portfolio view across linked schools — orders, deliveries, and
          invoices. SKUs must match school catalog items for receive-to-stock.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 no-print">
          <Link href="/supplier/schools" className="btn btn-hero min-h-8">
            Schools portfolio
          </Link>
          <Link href="/supplier/deliveries" className="btn btn-hero-ghost min-h-8">
            New delivery
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-label">At a glance</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Linked schools", value: portfolio.length },
            { label: "Orders", value: orders.length },
            { label: "Open deliveries", value: openDeliveries },
            { label: "Unpaid invoices", value: unpaid },
          ].map((card) => (
            <div key={card.label} className="stat-card animate-rise">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value mt-1 text-[var(--accent)]">
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {notices.length > 0 && (
        <section className="card animate-rise">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Needs attention</h2>
              <p className="card-subtitle">
                <Link
                  href="/supplier/notifications"
                  className="text-[var(--accent)]"
                >
                  All notifications
                </Link>
              </p>
            </div>
            <span className="chip chip-warn">{notices.length}</span>
          </div>
          <div className="card-body-flush">
            <NoticesList notices={notices} />
          </div>
        </section>
      )}

      <section className="card animate-rise">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">School portfolio</h2>
            <p className="card-subtitle">Open work by campus</p>
          </div>
          <Link href="/supplier/schools" className="btn btn-ghost">
            View all
          </Link>
        </div>
        <div className="card-body">
          {portfolio.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No schools linked yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {portfolio.map((row) => (
                <li
                  key={row.linkId}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="font-medium">
                    {row.school.name}{" "}
                    <span className="text-[var(--muted)]">
                      ({row.school.code})
                    </span>
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {row.openOrders} orders · {row.openDeliveries} DN ·{" "}
                    {row.unpaidInvoices} unpaid
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
