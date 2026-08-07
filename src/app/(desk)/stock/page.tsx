import Link from "next/link";
import { format } from "date-fns";
import { AdjustStockForm } from "@/components/adjust-stock-form";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { recentLedger } from "@/modules/inventory/adjust";
import { listBalances } from "@/modules/inventory/receive";
import { prisma } from "@/lib/db";

export default async function StockPage() {
  const user = await requireSchoolUser();
  const writable = canWrite(user.role);
  const [balances, items, ledger] = await Promise.all([
    listBalances(user.schoolId),
    prisma.item.findMany({
      where: { schoolId: user.schoolId, active: true },
      include: { sizes: { orderBy: { sizeLabel: "asc" } } },
      orderBy: { name: "asc" },
    }),
    recentLedger(user.schoolId, 25),
  ]);

  return (
    <div className="page-stack">
      <header className="page-header animate-rise">
        <div className="page-header-main">
          <h1 className="page-title">Stock balances</h1>
          <p className="page-sub">
            Live on-hand quantities. Adjustments require a reason and post to the
            ledger.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {writable && (
            <Link href="/reorder" className="btn btn-secondary min-h-8">
              Reorder low stock
            </Link>
          )}
          <span className="chip">{balances.length} lines</span>
        </div>
      </header>

      {writable && items.length > 0 && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Adjust stock</h2>
              <p className="card-subtitle">
                Count corrections, damage, or found stock
              </p>
            </div>
          </div>
          <div className="card-body">
            <AdjustStockForm items={items} />
          </div>
        </section>
      )}

      <section className="section sm:hidden">
        <div className="section-label">Balances</div>
        <div className="grid gap-3">
          {balances.map((row) => (
            <div
              key={row.id}
              className={`card card-quiet card-accent p-3.5 ${
                row.qtyOnHand <= 5
                  ? "border-[color-mix(in_srgb,var(--warn)_40%,var(--line))]"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{row.item.name}</div>
                  <div className="mt-0.5 text-xs text-[var(--muted)]">
                    {row.item.sku} · Size {row.sizeLabel}
                  </div>
                </div>
                <div
                  className={`stat-value text-[22px] ${
                    row.qtyOnHand <= 5
                      ? "text-[var(--warn)]"
                      : "text-[var(--accent)]"
                  }`}
                >
                  {row.qtyOnHand}
                </div>
              </div>
              {row.qtyOnHand <= 5 && (
                <span className="chip chip-warn mt-3">Low stock</span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card hidden sm:block">
        <div className="card-header">
          <div>
            <h2 className="card-title">On hand</h2>
            <p className="card-subtitle">Item, size, and quantity</p>
          </div>
        </div>
        <div className="card-body-flush table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Size</th>
                <th>On hand</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.item.name}</td>
                  <td className="text-[var(--muted)]">{row.item.sku}</td>
                  <td>{row.sizeLabel}</td>
                  <td
                    className={`font-semibold ${
                      row.qtyOnHand <= 5 ? "text-[var(--warn)]" : ""
                    }`}
                  >
                    {row.qtyOnHand}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Recent ledger</h2>
            <p className="card-subtitle">Receive, issue, void, adjust, shortage</p>
          </div>
        </div>
        <div className="card-body overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Item</th>
                <th>Reason</th>
                <th>Delta</th>
                <th>By</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap text-xs text-[var(--muted)]">
                    {format(row.createdAt, "dd MMM HH:mm")}
                  </td>
                  <td>
                    {row.item.name}{" "}
                    <span className="text-[var(--muted)]">/{row.sizeLabel}</span>
                  </td>
                  <td className="capitalize">{row.reason}</td>
                  <td
                    className={
                      row.qtyDelta < 0
                        ? "font-semibold text-[var(--warn)]"
                        : "font-semibold text-[var(--ok)]"
                    }
                  >
                    {row.qtyDelta > 0 ? `+${row.qtyDelta}` : row.qtyDelta}
                  </td>
                  <td className="text-[var(--muted)]">
                    {row.actor?.name ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!ledger.length && (
            <p className="px-3.5 py-6 text-sm text-[var(--muted)]">
              No ledger activity yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
