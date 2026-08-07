import { redirect } from "next/navigation";
import { AddSizeForm } from "@/components/add-size-form";
import { CatalogItemForm } from "@/components/catalog-item-form";
import {
  toggleItemActiveAction,
} from "@/app/actions/catalog";
import { canManage, requireSchoolUser } from "@/lib/auth";
import { listItems } from "@/modules/catalog/items";

export default async function CatalogPage() {
  const user = await requireSchoolUser();
  if (!canManage(user.role)) redirect("/");

  const items = await listItems(user.schoolId);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Catalog</h1>
          <p className="page-sub">
            Uniform items and sizes used for receive, issue, and kits.
          </p>
        </div>
        <span className="chip">{items.length} items</span>
      </header>

      <section className="card animate-rise animate-rise-delay-1">
        <div className="card-header">
          <div>
            <h2 className="card-title">Add item</h2>
            <p className="card-subtitle">
              SKU, name, category, and comma-separated sizes
            </p>
          </div>
        </div>
        <div className="card-body">
          <CatalogItemForm />
        </div>
      </section>

      <section className="section">
        <div className="section-label">Items</div>
        <div className="grid gap-3">
          {items.map((item) => (
            <article key={item.id} className="card card-accent">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    {item.name}{" "}
                    {!item.active && (
                      <span className="chip chip-warn ml-1">Inactive</span>
                    )}
                  </h3>
                  <p className="card-subtitle">
                    {item.sku} · {item.category}
                  </p>
                </div>
                <form action={toggleItemActiveAction}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={item.active ? "false" : "true"}
                  />
                  <button type="submit" className="btn btn-secondary">
                    {item.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
              <div className="card-body space-y-3">
                <div className="flex flex-wrap gap-2">
                  {item.sizes.map((size) => (
                    <span key={size.id} className="chip">
                      {size.sizeLabel}
                    </span>
                  ))}
                  {item.sizes.length === 0 && (
                    <span className="text-sm text-[var(--muted)]">No sizes</span>
                  )}
                </div>
                <AddSizeForm itemId={item.id} />
              </div>
            </article>
          ))}
          {items.length === 0 && (
            <div className="card card-quiet p-4 text-sm text-[var(--muted)]">
              No catalog items yet. Add your first uniform item above.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
