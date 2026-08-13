import Link from "next/link";
import { NoticesList } from "@/components/notices-list";
import { canSupplierManage, requireSupplierUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { listActorCampuses } from "@/modules/identity/supplier-campuses";
import { listSupplierTeam } from "@/modules/identity/supplier-team";
import { listSupplierNotifications } from "@/modules/reports/notifications";
import { getSupplierBrand } from "@/modules/supply/branding";
import { listSupplierInvoices } from "@/modules/supply/invoices";
import { listSchoolPortfolio } from "@/modules/supply/portfolio";

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export default async function SupplierHomePage() {
  const user = await requireSupplierUser();
  const isAdmin = canSupplierManage(user.role);

  const [invoices, portfolio, brand, notices, team, campuses, awaitingStockPost] =
    await Promise.all([
      listSupplierInvoices(user.supplierId),
      listSchoolPortfolio(user.supplierId),
      getSupplierBrand(user.supplierId),
      listSupplierNotifications(user.supplierId, { take: 5, role: user.role }),
      isAdmin ? listSupplierTeam(user.supplierId) : Promise.resolve([]),
      listActorCampuses(user),
      prisma.delivery.count({
        where: {
          supplierId: user.supplierId,
          status: { in: ["packed", "in_transit"] },
          receipt: null,
        },
      }),
    ]);

  const campusIds = campuses.map((c) => c.id);
  const [openPlans, issuedToday] = campusIds.length
    ? await Promise.all([
        prisma.studentUniformPlan.count({
          where: { schoolId: { in: campusIds }, status: "open" },
        }),
        prisma.issueSlip.count({
          where: {
            schoolId: { in: campusIds },
            status: "issued",
            issuedAt: { gte: startOfLocalDay() },
          },
        }),
      ])
    : [0, 0];

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
          {isAdmin ? "Supply home" : "Issue desk"}
        </h1>
        <p className="page-sub mt-1 max-w-lg">
          {isAdmin
            ? "Set up in order, post stock, then issue. Staff only see the issue path."
            : "Issue uniforms on campus, clear what is still owed, and check today’s reports."}
        </p>
        <div className="hero-cta-row mt-4 no-print">
          <Link href="/supplier/issue" className="btn btn-hero">
            Issue
          </Link>
          <Link href="/supplier/incomplete" className="btn btn-hero-ghost">
            Still owed
          </Link>
          <Link href="/supplier/reports" className="btn btn-hero-ghost">
            Reports
          </Link>
        </div>
      </section>

      {isAdmin && (
        <section className="card national-panel animate-rise">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Do this in order</h2>
              <p className="card-subtitle">
                First-time setup. Skip a step if it is already done.
              </p>
            </div>
          </div>
          <div className="card-body">
            <ol className="space-y-3 text-sm">
              <li>
                <Link href="/supplier/schools" className="font-semibold text-[var(--accent)]">
                  1. Schools
                </Link>
                <span className="text-[var(--muted)]">
                  {" "}
                  — create or link a campus, then open Catalogue &amp; kits
                </span>
              </li>
              <li>
                <Link href="/supplier/catalog" className="font-semibold text-[var(--accent)]">
                  2. Products
                </Link>
                <span className="text-[var(--muted)]">
                  {" "}
                  — add SKUs, then select them onto the school catalogue
                </span>
              </li>
              <li>
                <Link href="/supplier/deliveries" className="font-semibold text-[var(--accent)]">
                  3. Deliveries
                </Link>
                <span className="text-[var(--muted)]">
                  {" "}
                  — create a DN and Post to campus stock
                </span>
              </li>
              <li>
                <Link href="/supplier/team" className="font-semibold text-[var(--accent)]">
                  4. Team
                </Link>
                <span className="text-[var(--muted)]">
                  {" "}
                  — assign campuses if staff will issue (skip if you issue yourself)
                </span>
              </li>
              <li>
                <Link href="/supplier/issue" className="font-semibold text-[var(--accent)]">
                  5. Issue
                </Link>
                <span className="text-[var(--muted)]">
                  {" "}
                  — test one student, then use Still owed and Reports
                </span>
              </li>
            </ol>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-label">
          {isAdmin ? "Operations at a glance" : "Today’s focus"}
        </div>
        <div className="national-monitor-grid">
          {(isAdmin
            ? [
                { label: "Linked schools", value: portfolio.length },
                { label: "Waiting for stock post", value: awaitingStockPost },
                { label: "Unpaid invoices", value: unpaid },
                { label: "Active team", value: activeTeam },
              ]
            : [
                { label: "My campuses", value: campuses.length },
                { label: "Still owed", value: openPlans },
                { label: "Issued today", value: issuedToday },
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
            <li>Issue uniforms and clear still-owed queues on your campuses</li>
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
