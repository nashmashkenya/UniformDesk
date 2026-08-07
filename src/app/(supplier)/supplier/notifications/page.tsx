import { NoticesList } from "@/components/notices-list";
import { requireSupplierUser } from "@/lib/auth";
import { listSupplierNotifications } from "@/modules/reports/notifications";

export default async function SupplierNotificationsPage() {
  const user = await requireSupplierUser();
  const notices = await listSupplierNotifications(user.supplierId);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            Packed deliveries to dispatch, unpaid invoices, and open orders.
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
