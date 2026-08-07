import { SupplierProductForm } from "@/components/supplier-product-form";
import { formatMoney } from "@/lib/money";
import { canSupplierWrite, requireSupplierUser } from "@/lib/auth";
import { listSupplierProducts } from "@/modules/supply/products";

export default async function SupplierCatalogPage() {
  const user = await requireSupplierUser();
  const products = await listSupplierProducts(user.supplierId);
  const canWrite = canSupplierWrite(user.role);

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">Supplier catalog</h1>
        <p className="page-sub">
          SKUs should match school catalog items so deliveries post to stock.
        </p>
      </section>

      {canWrite && (
        <section className="card">
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
