import Link from "next/link";
import { redirect } from "next/navigation";
import { ReorderForm } from "@/components/reorder-form";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { listLinkedSuppliers } from "@/modules/supply/products";
import { lowStockReorderSuggestions } from "@/modules/supply/reorder";

export default async function ReorderPage({
  searchParams,
}: {
  searchParams: Promise<{ supplierId?: string; threshold?: string }>;
}) {
  const user = await requireSchoolUser();
  if (!canWrite(user.role)) redirect("/stock");

  const { supplierId: supplierParam, threshold: thresholdParam } =
    await searchParams;
  const threshold = Math.max(0, Number(thresholdParam ?? 5) || 5);

  const links = await listLinkedSuppliers(user.schoolId);
  const suppliers = links.map((l) => ({
    id: l.supplier.id,
    name: l.supplier.name,
  }));

  if (!suppliers.length) {
    return (
      <div className="page-stack">
        <header className="page-header">
          <div className="page-header-main">
            <h1 className="page-title">Reorder</h1>
            <p className="page-sub">
              No linked suppliers yet. Link a supplier from the supply side, or
              ask your admin.
            </p>
          </div>
        </header>
        <Link href="/stock" className="btn btn-ghost w-fit">
          Back to stock
        </Link>
      </div>
    );
  }

  const supplierId =
    suppliers.find((s) => s.id === supplierParam)?.id ?? suppliers[0]!.id;
  const suggestions = await lowStockReorderSuggestions({
    schoolId: user.schoolId,
    supplierId,
    threshold,
    targetQty: 20,
  });
  const matched = suggestions.filter((s) => s.matched).length;

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Low-stock reorder</h1>
          <p className="page-sub">
            Suggests order lines for sizes at or below {threshold} on hand,
            matched by SKU to the supplier catalog.
          </p>
        </div>
        <span className="chip chip-warn">
          {matched}/{suggestions.length} matched
        </span>
      </header>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">Build purchase order</h2>
            <p className="card-subtitle">
              Threshold{" "}
              <Link
                href={`/reorder?supplierId=${supplierId}&threshold=5`}
                className="text-[var(--accent)]"
              >
                5
              </Link>
              {" · "}
              <Link
                href={`/reorder?supplierId=${supplierId}&threshold=10`}
                className="text-[var(--accent)]"
              >
                10
              </Link>
            </p>
          </div>
        </div>
        <div className="card-body">
          <ReorderForm
            suppliers={suppliers}
            initialSupplierId={supplierId}
            suggestions={suggestions}
          />
        </div>
      </section>
    </div>
  );
}
