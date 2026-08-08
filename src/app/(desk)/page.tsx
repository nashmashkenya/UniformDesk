import Link from "next/link";
import { format } from "date-fns";
import { IssueDeskPrefetch } from "@/components/issue-desk-prefetch";
import { NoticesList } from "@/components/notices-list";
import { requireSchoolUser } from "@/lib/auth";
import { listSchoolNotifications } from "@/modules/reports/notifications";
import { deskStats, issuedToday } from "@/modules/reports/reports";

export default async function DeskHomePage() {
  const user = await requireSchoolUser();
  const [stats, recent, notices] = await Promise.all([
    deskStats(user.schoolId),
    issuedToday(user.schoolId),
    listSchoolNotifications(user.schoolId, { take: 5 }),
  ]);

  const cards = [
    {
      label: "Issued today",
      value: stats.issuedToday,
      tone: "accent" as const,
    },
    {
      label: "Voided today",
      value: stats.voidedToday,
      tone: "muted" as const,
    },
    {
      label: "Shortages",
      value: stats.shortageLines,
      tone: "warn" as const,
    },
    {
      label: "Low stock",
      value: stats.lowStock,
      tone: "warn" as const,
    },
  ];

  return (
    <div className="page-stack">
      <IssueDeskPrefetch />
      <section className="desk-hero animate-rise">
        <p className="text-xs font-semibold text-[var(--hero-muted)]">
          {user.schoolName} · school reporter
        </p>
        <h1 className="mt-1 text-[22px] font-semibold leading-7 sm:text-[28px] sm:leading-9">
          Good day, {user.name.split(" ")[0]}
        </h1>
        <p className="page-sub mt-1 max-w-lg">
          Campus view — co-issue at admission, watch stock, and report issues.
          Purchasing stays with your supplier.
        </p>
        <div className="hero-cta-row mt-4 no-print">
          <Link href="/issue" className="btn btn-hero">
            Co-issue uniforms
          </Link>
          <Link href="/stock" className="btn btn-hero-ghost">
            Stock
          </Link>
          <Link href="/reports" className="btn btn-hero-ghost">
            Reports
          </Link>
          <Link href="/incomplete" className="btn btn-hero-ghost">
            Still to receive
          </Link>
        </div>
      </section>

      <section className="section">
        <div className="section-label">Today at a glance</div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((card, i) => (
            <div
              key={card.label}
              className={[
                "stat-card animate-rise",
                card.tone === "warn" && card.value > 0 ? "is-warn" : "",
                card.tone === "muted" ? "is-muted" : "",
                i === 1 ? "animate-rise-delay-1" : "",
                i === 2 ? "animate-rise-delay-2" : "",
                i === 3 ? "animate-rise-delay-3" : "",
              ].join(" ")}
            >
              <div className="stat-label">{card.label}</div>
              <div
                className={`stat-value mt-1 ${
                  card.tone === "warn" && card.value > 0
                    ? "text-[var(--warn)]"
                    : card.tone === "accent"
                      ? "text-[var(--accent)]"
                      : ""
                }`}
              >
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
              <h2 className="card-title">Needs attention</h2>
              <p className="card-subtitle">
                <Link href="/notifications" className="text-[var(--accent)]">
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

      <section className="card animate-rise animate-rise-delay-2">
        <div className="card-header">
          <div>
            <h2 className="card-title">Issued today</h2>
            <p className="card-subtitle">
              Signed slips ·{" "}
              <Link href="/activity" className="text-[var(--accent)]">
                full activity
              </Link>
            </p>
          </div>
          <span className="chip chip-accent">{recent.length}</span>
        </div>
        <div className="card-body-flush">
          {recent.length === 0 && (
            <p className="px-3.5 py-8 text-sm text-[var(--muted)]">
              No issues yet today. Open <strong>Issue</strong> to start.
            </p>
          )}
          {recent.map((slip) => (
            <Link key={slip.id} href={`/slips/${slip.id}`} className="list-row">
              <span className="min-w-0">
                <span className="block font-semibold">{slip.student.fullName}</span>
                <span className="text-xs text-[var(--muted)]">{slip.slipNo}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                <span>{format(slip.issuedAt, "HH:mm")}</span>
                <span
                  className={
                    slip.status === "voided" ? "chip chip-warn" : "chip chip-ok"
                  }
                >
                  {slip.status}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
