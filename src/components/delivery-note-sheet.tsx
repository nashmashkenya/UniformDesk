import { format } from "date-fns";
import { formatMoney } from "@/lib/money";

type Line = {
  id: string;
  sizeLabel: string;
  qty: number;
  unitPrice: number;
  product: { name: string; sku: string };
};

export function DeliveryNoteSheet({
  deliveryNo,
  status,
  createdAt,
  dispatchedAt,
  deliveredAt,
  note,
  fromName,
  fromSub,
  toName,
  toSub,
  orderNo,
  lines,
}: {
  deliveryNo: string;
  status: string;
  createdAt: Date;
  dispatchedAt?: Date | null;
  deliveredAt?: Date | null;
  note?: string | null;
  fromName: string;
  fromSub?: string | null;
  toName: string;
  toSub?: string | null;
  orderNo?: string | null;
  lines: Line[];
}) {
  const total = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);

  return (
    <article className="print-sheet print-doc card">
      <div className="card-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Delivery note
          </p>
          <h2 className="card-title text-lg">{deliveryNo}</h2>
          <p className="card-subtitle capitalize">{status.replaceAll("_", " ")}</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{fromName}</div>
          {fromSub && <div className="text-[var(--muted)]">{fromSub}</div>}
          <div className="mt-1 text-xs text-[var(--muted)]">
            Created {format(createdAt, "dd MMM yy HH:mm")}
          </div>
        </div>
      </div>

      <div className="card-body space-y-3">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="card-inset">
            <div className="section-label">Ship to</div>
            <div className="mt-0.5 font-semibold">{toName}</div>
            {toSub && <div className="text-[var(--muted)]">{toSub}</div>}
          </div>
          <div className="card-inset">
            <div className="section-label">References</div>
            <div className="mt-0.5">
              {orderNo ? `Order ${orderNo}` : "No linked order"}
            </div>
            {dispatchedAt && (
              <div className="text-[var(--muted)]">
                Dispatched {format(dispatchedAt, "dd MMM yy HH:mm")}
              </div>
            )}
            {deliveredAt && (
              <div className="text-[var(--muted)]">
                Delivered {format(deliveredAt, "dd MMM yy HH:mm")}
              </div>
            )}
          </div>
        </div>

        <div className="table-wrap overflow-hidden rounded-[6px] border border-[var(--line)]">
          <table className="data-table min-w-0">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id}>
                  <td>{line.product.name}</td>
                  <td className="font-mono text-xs">{line.product.sku}</td>
                  <td>{line.sizeLabel}</td>
                  <td>{line.qty}</td>
                  <td>{formatMoney(line.unitPrice)}</td>
                  <td>{formatMoney(line.qty * line.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-2 text-sm">
          <div className="text-[var(--muted)]">
            {note ? `Note: ${note}` : "No delivery note"}
          </div>
          <div className="text-right">
            <div className="section-label">Goods value</div>
            <div className="text-lg font-semibold">{formatMoney(total)}</div>
          </div>
        </div>

        <div className="grid gap-4 pt-2 text-sm sm:grid-cols-2 print:grid-cols-2">
          <div>
            <div className="section-label">Supplier sign</div>
            <div className="mt-6 border-b border-[var(--line)]" />
            <div className="mt-1 text-xs text-[var(--muted)]">Name / date</div>
          </div>
          <div>
            <div className="section-label">School receive sign</div>
            <div className="mt-6 border-b border-[var(--line)]" />
            <div className="mt-1 text-xs text-[var(--muted)]">Name / date</div>
          </div>
        </div>
      </div>
    </article>
  );
}
