import Link from "next/link";
import { SupplierProductForm } from "@/components/supplier-product-form";
import { formatMoney } from "@/lib/money";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { listSupplierProducts } from "@/modules/supply/products";

export default async function SupplierCatalogPage() {
  const user = await requireSupplierAdmin();
  const products = await listSupplierProducts(user.supplierId);
  const canWrite = true;

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Supplier products</h1>
        <p className="page-sub">
          Your master SKUs and prices for orders, DNs, and invoices. Match each
          SKU to the school’s catalogue item so receive posts to the right stock.
          Per-school items and kits live under{" "}
          <Link href="/supplier/schools" className="text-[var(--accent)]">
            Schools → Catalogue &amp; kits
          </Link>
          .
        </p>
      </section>

      {canWrite && (
        <section className="card national-panel">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Add product</h2>
              <p className="card-subtitle">Price stored in cents (KES)</p>
            </div>
          </div>
          <div className="card-body">
            <SupplierProductForm />
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">Products</h2>
            <p className="card-subtitle">{products.length} items</p>
          </div>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Sizes</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{p.sizes.map((s) => s.sizeLabel).join(", ")}</td>
                  <td>{formatMoney(p.unitPrice)}</td>
                  <td>{p.active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
