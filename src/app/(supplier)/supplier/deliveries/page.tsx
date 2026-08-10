import Link from "next/link";
import { format } from "date-fns";
import { StatusPill } from "@/components/status-pill";
import { SupplyDeliveryForm } from "@/components/supply-lines-form";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { listSupplierDeliveries } from "@/modules/supply/deliveries";
import {
  listLinkedSchools,
  listSupplierProducts,
} from "@/modules/supply/products";

export default async function SupplierDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string }>;
}) {
  const user = await requireSupplierAdmin();
  const { schoolId } = await searchParams;
  const [deliveries, links, products] = await Promise.all([
    listSupplierDeliveries(user.supplierId),
    listLinkedSchools(user.supplierId),
    listSupplierProducts(user.supplierId),
  ]);
  const canWrite = true;
  const filtered = schoolId
    ? deliveries.filter((d) => d.schoolId === schoolId)
    : deliveries;
  const filterSchool = links.find((l) => l.schoolId === schoolId)?.school;

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Deliveries</h1>
        <p className="page-sub">
          {filterSchool
            ? `Filtered · ${filterSchool.name}`
            : "Pack, dispatch, then invoice after school receive."}
          {filterSchool && (
            <>
              {" · "}
              <Link href="/supplier/deliveries" className="text-[var(--accent)]">
                Clear filter
              </Link>
            </>
          )}
        </p>
      </section>

      {canWrite && (
        <section className="card national-panel">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">New delivery</h2>
              <p className="card-subtitle">Optional: create from an order instead</p>
            </div>
          </div>
          <div className="card-body">
            <SupplyDeliveryForm
              schools={links.map((l) => ({
                id: l.school.id,
                name: l.school.name,
              }))}
              products={products.filter((p) => p.active)}
              defaultSchoolId={schoolId}
            />
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h2 className="card-title text-base">
            {filterSchool ? "School deliveries" : "All deliveries"}
          </h2>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Delivery</th>
                <th>School</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link
                      href={`/supplier/deliveries/${d.id}`}
                      className="font-semibold text-[var(--accent)]"
                    >
                      {d.deliveryNo}
                    </Link>
                  </td>
                  <td>{d.school.name}</td>
                  <td>
                    <StatusPill status={d.status} />
                  </td>
                  <td>{format(d.createdAt, "dd MMM yyyy")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
