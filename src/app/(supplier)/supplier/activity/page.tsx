import { ActivityTimeline } from "@/components/activity-timeline";
import { requireSupplierUser } from "@/lib/auth";
import {
  supplierActivityFeed,
  type SupplierActivityKind,
} from "@/modules/reports/activity";

const kindLabel: Record<SupplierActivityKind, string> = {
  order: "Order",
  delivery_created: "Packed",
  delivery_dispatch: "Dispatch",
  delivery_delivered: "Delivered",
  invoice_issued: "Invoice",
  payment_confirmed: "Paid",
  co_issue: "Co-issue",
};

const kindTone: Record<SupplierActivityKind, string> = {
  order: "chip",
  delivery_created: "chip chip-accent",
  delivery_dispatch: "chip chip-accent",
  delivery_delivered: "chip chip-ok",
  invoice_issued: "chip chip-warn",
  payment_confirmed: "chip chip-ok",
  co_issue: "chip chip-accent",
};

export default async function SupplierActivityPage() {
  const user = await requireSupplierUser();
  const events = await supplierActivityFeed(user.supplierId, 50);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Activity</h1>
          <p className="page-sub">
            Supply timeline — orders, pack/dispatch, co-issue at schools,
            invoices, and payment confirmations.
          </p>
        </div>
        <span className="chip">{events.length}</span>
      </header>

      <section className="card">
        <div className="card-body-flush">
          <ActivityTimeline
            events={events}
            empty="No supply activity yet. Create an order or delivery to start the trail."
            kindLabel={kindLabel}
            kindTone={kindTone}
          />
        </div>
      </section>
    </div>
  );
}
