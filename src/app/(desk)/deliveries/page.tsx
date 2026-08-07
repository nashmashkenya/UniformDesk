import Link from "next/link";
import { format } from "date-fns";
import { StatusPill } from "@/components/status-pill";
import { requireSchoolUser } from "@/lib/auth";
import { listSchoolDeliveries } from "@/modules/supply/deliveries";

export default async function SchoolDeliveriesPage() {
  const user = await requireSchoolUser();
  const deliveries = await listSchoolDeliveries(user.schoolId);
  const incoming = deliveries.filter((d) => d.status !== "delivered");

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Deliveries</h1>
        <p className="page-sub">
          Receive against a supplier delivery note to post stock with proof.
        </p>
      </section>

      {incoming.length > 0 && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Awaiting receive</h2>
              <p className="card-subtitle">{incoming.length} open</p>
            </div>
          </div>
          <div className="card-body space-y-2">
            {incoming.map((d) => (
              <Link
                key={d.id}
                href={`/deliveries/${d.id}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] bg-[var(--surface-2)] px-3 py-3"
              >
                <div>
                  <div className="font-semibold text-[var(--accent)]">
                    {d.deliveryNo}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {d.supplier.name}
                  </div>
                </div>
                <StatusPill status={d.status} />
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title text-base">All deliveries</h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link
                      href={`/deliveries/${d.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      {d.deliveryNo}
                    </Link>
                  </td>
                  <td>{d.supplier.name}</td>
                  <td>
                    <StatusPill status={d.status} />
                  </td>
                  <td>{format(d.createdAt, "dd MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!deliveries.length && (
            <p className="text-sm text-[var(--muted)]">
              No supplier deliveries yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
