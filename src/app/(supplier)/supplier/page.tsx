import Link from "next/link";
import { NoticesList } from "@/components/notices-list";
import { canSupplierManage, requireSupplierUser } from "@/lib/auth";
import { listSupplierNotifications } from "@/modules/reports/notifications";
import { getSupplierBrand } from "@/modules/supply/branding";
import { listSupplierDeliveries } from "@/modules/supply/deliveries";
import { listSupplierInvoices } from "@/modules/supply/invoices";
import { listSupplierOrders } from "@/modules/supply/orders";
import { listSchoolPortfolio } from "@/modules/supply/portfolio";
import { listSupplierTeam } from "@/modules/identity/supplier-team";

export default async function SupplierHomePage() {
  const user = await requireSupplierUser();
  const isAdmin = canSupplierManage(user.role);

  const [orders, deliveries, invoices, portfolio, brand, notices, team] =
    await Promise.all([
      listSupplierOrders(user.supplierId),
      listSupplierDeliveries(user.supplierId),
      listSupplierInvoices(user.supplierId),
      listSchoolPortfolio(user.supplierId),
      getSupplierBrand(user.supplierId),
      listSupplierNotifications(user.supplierId, { take: 5 }),
      isAdmin ? listSupplierTeam(user.supplierId) : Promise.resolve([]),
    ]);

  const openDeliveries = deliveries.filter(
    (d) => d.status === "packed" || d.status === "in_transit",
  ).length;
  const unpaid = invoices.filter((i) => i.status === "issued").length;
  const displayName = brand?.brandName ?? user.supplierName;
  const activeTeam = team.filter((m) => m.active).length;

  return (
    <div className="page-stack">
      <section className="desk-hero animate-rise">
        <p className="national-kicker text-[var(--hero-muted)]">
          {displayName}
        </p>
        <h1 className="mt-1 text-[22px] font-semibold leading-7 sm:text-[28px] sm:leading-9">
          {isAdmin ? "National supply monitor" : "Issue desk"}
        </h1>
        <p className="page-sub mt-1 max-w-lg">
          {isAdmin
            ? "Oversee linked schools, team access, supply documents, and co-issue across campuses."
            : "Issue uniforms on campus, clear what is still owed, and check today’s reports."}
        </p>
        <div className="hero-cta-row mt-4 no-print">
          <Link href="/supplier/issue" className="btn btn-hero">
            Co-issue desk
          </Link>
          <Link href="/supplier/reports" className="btn btn-hero-ghost">
            Reports
          </Link>
          {isAdmin ? (
            <Link href="/supplier/schools" className="btn btn-hero-ghost">
              Schools
            </Link>
          ) : (
            <Link href="/supplier/incomplete" className="btn btn-hero-ghost">
              Still owed
            </Link>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-label">
          {isAdmin ? "Operations at a glance" : "Today’s focus"}
        </div>
        <div className="national-monitor-grid">
          {(isAdmin
            ? [
                { label: "Linked schools", value: portfolio.length },
                { label: "Open deliveries", value: openDeliveries },
                { label: "Unpaid invoices", value: unpaid },
                { label: "Active team", value: activeTeam },
              ]
            : [
                { label: "Linked schools", value: portfolio.length },
                { label: "Open deliveries", value: openDeliveries },
                { label: "Orders on file", value: orders.length },
                { label: "Unpaid invoices", value: unpaid },
              ]
          ).map((card) => (
            <div key={card.label} className="national-stat animate-rise">
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          ))}
        </div>
      </section>

      {notices.length > 0 && (
        <section className="card national-panel animate-rise">
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

      {isAdmin ? (
        <section className="card national-panel animate-rise">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">School portfolio</h2>
              <p className="card-subtitle">Open work by campus</p>
            </div>
            <Link href="/supplier/schools" className="btn btn-ghost">
              Manage schools
            </Link>
          </div>
          <div className="card-body">
            {portfolio.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                No schools linked yet. Create or link a school to begin.
              </p>
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
      ) : (
        <section className="national-note animate-rise">
          <strong>Staff access</strong>
          <ul>
            <li>Co-issue uniforms and clear still-owed queues</li>
            <li>View issued-today and campus stock reports</li>
            <li>
              Ask an admin for schools, products, deliveries, invoices, or team
              changes
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
