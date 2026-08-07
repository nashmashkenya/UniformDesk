import Link from "next/link";
import { format } from "date-fns";
import { StatusPill } from "@/components/status-pill";
import { SupplyOrderForm } from "@/components/supply-lines-form";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { listSchoolOrders } from "@/modules/supply/orders";
import {
  listLinkedSuppliers,
  listSupplierProducts,
} from "@/modules/supply/products";

export default async function SchoolOrdersPage() {
  const user = await requireSchoolUser();
  const [orders, links] = await Promise.all([
    listSchoolOrders(user.schoolId),
    listLinkedSuppliers(user.schoolId),
  ]);

  const productsBySupplier: Record<
    string,
    Awaited<ReturnType<typeof listSupplierProducts>>
  > = {};
  for (const link of links) {
    productsBySupplier[link.supplierId] = (
      await listSupplierProducts(link.supplierId)
    ).filter((p) => p.active);
  }

  const writable = canWrite(user.role);

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Supply orders</h1>
        <p className="page-sub">Order from linked suppliers.</p>
      </section>

      {writable && links.length > 0 && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Create order</h2>
            </div>
          </div>
          <div className="card-body">
            <SupplyOrderForm
              asSupplier={false}
              parties={links.map((l) => ({
                id: l.supplier.id,
                name: l.supplier.name,
              }))}
              productsBySupplier={productsBySupplier}
            />
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title text-base">Orders</h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      {order.orderNo}
                    </Link>
                  </td>
                  <td>{order.supplier.name}</td>
                  <td>
                    <StatusPill status={order.status} />
                  </td>
                  <td>{format(order.createdAt, "dd MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && (
            <p className="text-sm text-[var(--muted)]">No orders yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
