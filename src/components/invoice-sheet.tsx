import { format } from "date-fns";
import { formatMoney } from "@/lib/money";

type Line = {
  id: string;
  sizeLabel: string;
  qty: number;
  unitPrice: number;
  product: { name: string; sku: string };
};

export function InvoiceSheet({
  invoiceNo,
  status,
  amountCents,
  issuedAt,
  paidAt,
  note,
  fromName,
  fromSub,
  toName,
  toSub,
  deliveryNo,
  lines,
}: {
  invoiceNo: string;
  status: string;
  amountCents: number;
  issuedAt?: Date | null;
  paidAt?: Date | null;
  note?: string | null;
  fromName: string;
  fromSub?: string | null;
  toName: string;
  toSub?: string | null;
  deliveryNo?: string | null;
  lines: Line[];
}) {
  return (
    <article className="print-sheet print-doc card">
      <div className="card-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Tax invoice / bill
          </p>
          <h2 className="card-title text-lg">{invoiceNo}</h2>
          <p className="card-subtitle capitalize">{status}</p>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{fromName}</div>
          {fromSub && <div className="text-[var(--muted)]">{fromSub}</div>}
          <div className="mt-1 text-xs text-[var(--muted)]">
            Issued {issuedAt ? format(issuedAt, "dd MMM yy") : "—"}
          </div>
        </div>
      </div>

      <div className="card-body space-y-3">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="card-inset">
            <div className="section-label">Bill to</div>
            <div className="mt-0.5 font-semibold">{toName}</div>
            {toSub && <div className="text-[var(--muted)]">{toSub}</div>}
          </div>
          <div className="card-inset">
            <div className="section-label">Delivery</div>
            <div className="mt-0.5 font-semibold">{deliveryNo ?? "—"}</div>
            {paidAt && (
              <div className="text-[var(--muted)]">
                Paid {format(paidAt, "dd MMM yy HH:mm")}
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

        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="text-sm text-[var(--muted)]">
            {note ? `Note: ${note}` : "UniformDesk supply invoice"}
          </div>
          <div className="text-right">
            <div className="section-label">Total due</div>
            <div className="text-xl font-semibold">
              {formatMoney(amountCents)}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
