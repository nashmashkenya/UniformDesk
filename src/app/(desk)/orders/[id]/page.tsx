import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { cancelOrderAction } from "@/app/actions/supply";
import { StatusPill } from "@/components/status-pill";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getOrder } from "@/modules/supply/orders";

export default async function SchoolOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSchoolUser();
  const { id } = await params;
  const order = await getOrder(id);
  if (!order || order.schoolId !== user.schoolId) notFound();

  const canCancel =
    canWrite(user.role) &&
    order.status !== "cancelled" &&
    order.status !== "fulfilled";

  return (
    <div className="page-stack">
      <section>
        <p className="text-xs text-[var(--muted)]">
          <Link href="/orders" className="text-[var(--accent)]">
            Orders
          </Link>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="page-title">{order.orderNo}</h1>
          <StatusPill status={order.status} />
        </div>
        <p className="page-sub">
          {order.supplier.name} ·{" "}
          {format(order.createdAt, "dd MMM yyyy HH:mm")}
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <h2 className="card-title text-base">Lines</h2>
          {canCancel && (
            <form action={cancelOrderAction}>
              <input type="hidden" name="asSupplier" value="false" />
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className="btn btn-ghost text-[var(--danger)]">
                Cancel order
              </button>
            </form>
          )}
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    {line.product.name}{" "}
                    <span className="font-mono text-xs text-[var(--muted)]">
                      {line.product.sku}
                    </span>
                  </td>
                  <td>{line.sizeLabel}</td>
                  <td>{line.qty}</td>
                  <td>{formatMoney(line.unitPrice)}</td>
                  <td>{formatMoney(line.qty * line.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {order.deliveries.length > 0 && (
        <section className="card">
          <div className="card-header">
            <h2 className="card-title text-base">Deliveries</h2>
          </div>
          <div className="card-body space-y-2 text-sm">
            {order.deliveries.map((d) => (
              <Link
                key={d.id}
                href={`/deliveries/${d.id}`}
                className="flex items-center justify-between rounded-[4px] bg-[var(--surface-2)] px-3 py-2"
              >
                <span className="font-semibold text-[var(--accent)]">
                  {d.deliveryNo}
                </span>
                <StatusPill status={d.status} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
