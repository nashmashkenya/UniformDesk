import { redirect } from "next/navigation";
import { KitForm } from "@/components/kit-form";
import { toggleKitActiveAction } from "@/app/actions/catalog";
import { canManage, requireSchoolUser } from "@/lib/auth";
import { listItems } from "@/modules/catalog/items";
import { listKits } from "@/modules/catalog/kits";

export default async function KitsPage() {
  const user = await requireSchoolUser();
  if (!canManage(user.role)) redirect("/");

  const [kits, items] = await Promise.all([
    listKits(user.schoolId),
    listItems(user.schoolId),
  ]);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Kits</h1>
          <p className="page-sub">
            Default issue bundles for the storekeeper desk.
          </p>
        </div>
        <span className="chip">{kits.length} kits</span>
      </header>

      <section className="card animate-rise animate-rise-delay-1">
        <div className="card-header">
          <div>
            <h2 className="card-title">Create kit</h2>
            <p className="card-subtitle">
              Choose active catalog items and default quantities
            </p>
          </div>
        </div>
        <div className="card-body">
          <KitForm items={items} />
        </div>
      </section>

      <section className="section">
        <div className="section-label">Defined kits</div>
        <div className="grid gap-3">
          {kits.map((kit) => (
            <article key={kit.id} className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">
                    {kit.name}{" "}
                    {!kit.active && (
                      <span className="chip chip-warn ml-1">Inactive</span>
                    )}
                  </h3>
                  <p className="card-subtitle">
                    Academic year {kit.academicYear} · {kit.lines.length} lines
                  </p>
                </div>
                <form action={toggleKitActiveAction}>
                  <input type="hidden" name="kitId" value={kit.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={kit.active ? "false" : "true"}
                  />
                  <button type="submit" className="btn btn-secondary">
                    {kit.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
              <div className="card-body">
                <div className="overflow-hidden rounded-[6px] border border-[var(--line)]">
                  <table className="data-table min-w-0">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>SKU</th>
                        <th>Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kit.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="font-medium">{line.item.name}</td>
                          <td className="text-[var(--muted)]">
                            {line.item.sku}
                          </td>
                          <td>{line.qtyDefault}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </article>
          ))}
          {kits.length === 0 && (
            <div className="card card-quiet p-4 text-sm text-[var(--muted)]">
              No kits yet. Create one to speed up the issue desk.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
