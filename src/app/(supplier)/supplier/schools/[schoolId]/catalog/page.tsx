import Link from "next/link";
import { notFound } from "next/navigation";
import {
  toggleSchoolItemActiveAction,
  toggleSchoolKitActiveAction,
} from "@/app/actions/school-catalog";
import {
  SchoolAddSizeForm,
  SchoolCatalogItemForm,
  SchoolKitForm,
} from "@/components/school-catalog-forms";
import { canSupplierManage } from "@/lib/auth";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { listItems } from "@/modules/catalog/items";
import { listKits } from "@/modules/catalog/kits";
import { assertSupplierSchoolLink } from "@/modules/supply/orders";
import { listSupplierProducts } from "@/modules/supply/products";
import { prisma } from "@/lib/db";

export default async function SupplierSchoolCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ schoolId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireSupplierAdmin();
  const { schoolId } = await params;
  const { view: viewParam } = await searchParams;
  const view = viewParam === "kits" ? "kits" : "items";
  const writable = canSupplierManage(user.role);

  try {
    await assertSupplierSchoolLink(user.supplierId, schoolId);
  } catch {
    notFound();
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, code: true },
  });
  if (!school) notFound();

  if (!user.supplierId) notFound();

  const [items, kits, products] = await Promise.all([
    listItems(schoolId),
    listKits(schoolId),
    listSupplierProducts(user.supplierId),
  ]);

  const activeItems = items.filter((i) => i.active);
  const schoolSkus = new Set(items.map((i) => i.sku.toUpperCase()));
  const publishableProducts = products
    .filter((p) => p.active && !schoolSkus.has(p.sku.toUpperCase()))
    .map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category,
      sizes: p.sizes.map((s) => s.sizeLabel),
    }));

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            School catalogue
          </p>
          <h1 className="page-title">
            {school.name}{" "}
            <span className="text-[var(--muted)]">({school.code})</span>
          </h1>
          <p className="page-sub">
            Select products from your master list onto this school, then build
            admission kits. Selecting products keeps SKUs exact for stock post
            and co-issue.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/supplier/schools" className="btn btn-secondary">
            All schools
          </Link>
          <Link
            href={`/supplier/issue?schoolId=${school.id}`}
            className="btn btn-primary"
          >
            Co-issue
          </Link>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/supplier/schools/${school.id}/catalog?view=items`}
          className={`btn ${view === "items" ? "btn-primary" : "btn-secondary"}`}
        >
          Items ({items.length})
        </Link>
        <Link
          href={`/supplier/schools/${school.id}/catalog?view=kits`}
          className={`btn ${view === "kits" ? "btn-primary" : "btn-secondary"}`}
        >
          Kits ({kits.length})
        </Link>
        <Link
          href="/supplier/catalog"
          className="btn btn-ghost"
        >
          Supplier products →
        </Link>
      </div>

      {view === "items" ? (
        <>
          {writable && (
            <section className="card national-panel">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Add from products</h2>
                  <p className="card-subtitle">
                    Tick products to put on this campus — no SKU retyping
                  </p>
                </div>
              </div>
              <div className="card-body">
                <SchoolCatalogItemForm
                  schoolId={school.id}
                  products={publishableProducts}
                />
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Items on this school</h2>
                <p className="card-subtitle">
                  {activeItems.length} active · {items.length - activeItems.length}{" "}
                  inactive
                  {publishableProducts.length
                    ? ` · ${publishableProducts.length} product(s) still available to add`
                    : ""}
                </p>
              </div>
            </div>
            <div className="card-body space-y-3">
              {!items.length && (
                <p className="text-sm text-[var(--muted)]">
                  No items yet. Select products above (or add them under
                  Products first).
                </p>
              )}
              {items.map((item) => (
                <article
                  key={item.id}
                  className={`card-inset ${!item.active ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">
                        {item.name}{" "}
                        <span className="text-[var(--muted)]">
                          ({item.sku})
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs capitalize text-[var(--muted)]">
                        {item.category}
                        {!item.active ? " · inactive" : ""}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {item.sizes.map((size) => (
                          <span key={size.id} className="chip">
                            {size.sizeLabel}
                          </span>
                        ))}
                        {!item.sizes.length && (
                          <span className="text-xs text-[var(--muted)]">
                            No sizes
                          </span>
                        )}
                      </div>
                    </div>
                    {writable && (
                      <form action={toggleSchoolItemActiveAction}>
                        <input type="hidden" name="schoolId" value={school.id} />
                        <input type="hidden" name="itemId" value={item.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={item.active ? "false" : "true"}
                        />
                        <button type="submit" className="btn btn-ghost">
                          {item.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    )}
                  </div>
                  {writable && item.active && (
                    <div className="mt-3 border-t border-[var(--line)] pt-3">
                      <SchoolAddSizeForm
                        schoolId={school.id}
                        itemId={item.id}
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <>
          {writable && (
            <section className="card national-panel">
              <div className="card-header">
                <div>
                  <h2 className="card-title">Create admission kit</h2>
                  <p className="card-subtitle">
                    e.g. Form 1 Girls, Form 1 Boys — used on co-issue
                  </p>
                </div>
              </div>
              <div className="card-body">
                {activeItems.length ? (
                  <SchoolKitForm schoolId={school.id} items={items} />
                ) : (
                  <p className="text-sm text-[var(--muted)]">
                    Add products on the Items tab first (select from your
                    product list), then build kits by choosing those items.
                  </p>
                )}
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Kits for this school</h2>
                <p className="card-subtitle">
                  Each kit defines what a student should receive
                </p>
              </div>
            </div>
            <div className="card-body space-y-3">
              {!kits.length && (
                <p className="text-sm text-[var(--muted)]">
                  No kits yet. Create separate kits when girls and boys (or
                  streams) have different sets.
                </p>
              )}
              {kits.map((kit) => (
                <article
                  key={kit.id}
                  className={`card-inset ${!kit.active ? "opacity-70" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{kit.name}</div>
                      <div className="mt-0.5 text-xs text-[var(--muted)]">
                        {kit.academicYear}
                        {!kit.active ? " · inactive" : ""}
                      </div>
                      <ul className="mt-2 space-y-0.5 text-sm text-[var(--muted)]">
                        {kit.lines.map((line) => (
                          <li key={line.id}>
                            {line.qtyDefault}× {line.item.name} (
                            {line.item.sku})
                          </li>
                        ))}
                      </ul>
                    </div>
                    {writable && (
                      <form action={toggleSchoolKitActiveAction}>
                        <input type="hidden" name="schoolId" value={school.id} />
                        <input type="hidden" name="kitId" value={kit.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={kit.active ? "false" : "true"}
                        />
                        <button type="submit" className="btn btn-ghost">
                          {kit.active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
