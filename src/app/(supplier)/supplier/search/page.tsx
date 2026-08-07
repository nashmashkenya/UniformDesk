import Link from "next/link";
import { requireSupplierUser } from "@/lib/auth";
import {
  searchSupplierDesk,
  type SupplierSearchHit,
} from "@/modules/reports/search";

const kindLabel: Record<SupplierSearchHit["kind"], string> = {
  school: "School",
  product: "Product",
  order: "Order",
  delivery: "Delivery",
  invoice: "Invoice",
};

export default async function SupplierSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireSupplierUser();
  const { q = "" } = await searchParams;
  const query = q.trim();
  const hits =
    query.length >= 2
      ? await searchSupplierDesk(user.supplierId, query)
      : [];

  const grouped = {
    school: hits.filter((h) => h.kind === "school"),
    product: hits.filter((h) => h.kind === "product"),
    order: hits.filter((h) => h.kind === "order"),
    delivery: hits.filter((h) => h.kind === "delivery"),
    invoice: hits.filter((h) => h.kind === "invoice"),
  };

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Search</h1>
          <p className="page-sub">
            Find schools, products, orders, deliveries, and invoices.
          </p>
        </div>
      </header>

      <section className="card">
        <div className="card-body">
          <form action="/supplier/search" className="flex flex-wrap gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="School, SKU, PO-…, DN-…, INV-…"
              autoFocus
              autoComplete="off"
              className="field min-w-[16rem] flex-1"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>
          {query.length > 0 && query.length < 2 && (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Type at least 2 characters.
            </p>
          )}
        </div>
      </section>

      {query.length >= 2 && (
        <section className="space-y-4">
          {hits.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No matches for “{query}”.
            </p>
          ) : (
            (Object.keys(grouped) as SupplierSearchHit["kind"][]).map(
              (kind) => {
                const rows = grouped[kind];
                if (!rows.length) return null;
                return (
                  <div key={kind} className="card">
                    <div className="card-header">
                      <h2 className="card-title text-base">
                        {kindLabel[kind]}
                        <span className="ml-2 chip">{rows.length}</span>
                      </h2>
                    </div>
                    <div className="card-body-flush">
                      {rows.map((hit) => (
                        <Link
                          key={hit.id}
                          href={hit.href}
                          className="list-row"
                        >
                          <span className="min-w-0">
                            <span className="block font-semibold text-[var(--accent)]">
                              {hit.title}
                            </span>
                            <span className="text-xs text-[var(--muted)]">
                              {hit.subtitle}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              },
            )
          )}
        </section>
      )}
    </div>
  );
}
