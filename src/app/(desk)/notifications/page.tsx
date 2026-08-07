import { requireSchoolUser } from "@/lib/auth";
import { NoticesList } from "@/components/notices-list";
import { listSchoolNotifications } from "@/modules/reports/notifications";

export default async function SchoolNotificationsPage() {
  const user = await requireSchoolUser();
  const notices = await listSchoolNotifications(user.schoolId);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            Low stock, unpaid invoices, inbound deliveries, and open orders.
          </p>
        </div>
        <span className="chip">{notices.length}</span>
      </header>

      <section className="card">
        <div className="card-body-flush">
          <NoticesList notices={notices} />
        </div>
      </section>
    </div>
  );
}
