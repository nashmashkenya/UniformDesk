import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { cancelOrderAction } from "@/app/actions/supply";
import { StatusPill } from "@/components/status-pill";
import { SupplyDeliveryForm } from "@/components/supply-lines-form";
import { canSupplierWrite, requireSupplierUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { getOrder } from "@/modules/supply/orders";
import { listSupplierProducts } from "@/modules/supply/products";

export default async function SupplierOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSupplierUser();
  const { id } = await params;
  const [order, products] = await Promise.all([
    getOrder(id),
    listSupplierProducts(user.supplierId),
  ]);
  if (!order || order.supplierId !== user.supplierId) notFound();

  const canWrite = canSupplierWrite(user.role);
  const canCancel =
    canWrite && order.status !== "cancelled" && order.status !== "fulfilled";
  const canDeliver =
    canWrite && order.status !== "cancelled" && order.status !== "fulfilled";

  return (
    <div className="page-stack">
      <section>
        <p className="text-xs text-[var(--muted)]">
          <Link href="/supplier/orders" className="text-[var(--accent)]">
            Orders
          </Link>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="page-title">{order.orderNo}</h1>
          <StatusPill status={order.status} />
        </div>
        <p className="page-sub">
          {order.school.name} · {format(order.createdAt, "dd MMM yyyy HH:mm")}
        </p>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">Lines</h2>
          </div>
          {canCancel && (
            <form action={cancelOrderAction}>
              <input type="hidden" name="asSupplier" value="true" />
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
          {order.note && (
            <p className="mt-3 text-sm text-[var(--muted)]">Note: {order.note}</p>
          )}
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
                href={`/supplier/deliveries/${d.id}`}
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

      {canDeliver && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Create delivery from order</h2>
              <p className="card-subtitle">Fulfills this order when saved</p>
            </div>
          </div>
          <div className="card-body">
            <SupplyDeliveryForm
              schools={[{ id: order.school.id, name: order.school.name }]}
              products={products.filter((p) => p.active)}
              defaultSchoolId={order.schoolId}
              defaultOrderId={order.id}
              defaultLines={order.lines.map((l) => ({
                productId: l.productId,
                sizeLabel: l.sizeLabel,
                qty: l.qty,
              }))}
            />
          </div>
        </section>
      )}
    </div>
  );
}
