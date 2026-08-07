import Link from "next/link";
import { format } from "date-fns";
import { StatusPill } from "@/components/status-pill";
import { SupplyOrderForm } from "@/components/supply-lines-form";
import { canSupplierWrite, requireSupplierUser } from "@/lib/auth";
import { listSupplierOrders } from "@/modules/supply/orders";
import {
  listLinkedSchools,
  listSupplierProducts,
} from "@/modules/supply/products";

export default async function SupplierOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string }>;
}) {
  const user = await requireSupplierUser();
  const { schoolId } = await searchParams;
  const [orders, links, products] = await Promise.all([
    listSupplierOrders(user.supplierId),
    listLinkedSchools(user.supplierId),
    listSupplierProducts(user.supplierId),
  ]);
  const canWrite = canSupplierWrite(user.role);
  const filtered = schoolId
    ? orders.filter((o) => o.schoolId === schoolId)
    : orders;
  const filterSchool = links.find((l) => l.schoolId === schoolId)?.school;

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Orders</h1>
        <p className="page-sub">
          {filterSchool
            ? `Filtered · ${filterSchool.name}`
            : "Confirmed supply orders for linked schools."}
          {filterSchool && (
            <>
              {" · "}
              <Link href="/supplier/orders" className="text-[var(--accent)]">
                Clear filter
              </Link>
            </>
          )}
        </p>
      </section>

      {canWrite && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Create order</h2>
              <p className="card-subtitle">On behalf of a linked school</p>
            </div>
          </div>
          <div className="card-body">
            <SupplyOrderForm
              asSupplier
              parties={links.map((l) => ({
                id: l.school.id,
                name: l.school.name,
              }))}
              products={products.filter((p) => p.active)}
            />
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">
              {filterSchool ? "School orders" : "All orders"}
            </h2>
          </div>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>School</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/supplier/orders/${order.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      {order.orderNo}
                    </Link>
                  </td>
                  <td>{order.school.name}</td>
                  <td>
                    <StatusPill status={order.status} />
                  </td>
                  <td>{format(order.createdAt, "dd MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
