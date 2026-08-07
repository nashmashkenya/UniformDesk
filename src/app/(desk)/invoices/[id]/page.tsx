import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { InvoiceSheet } from "@/components/invoice-sheet";
import { PrintButton } from "@/components/print-button";
import { StatusPill } from "@/components/status-pill";
import { formatMoney } from "@/lib/money";
import { requireSchoolUser } from "@/lib/auth";
import { getInvoice } from "@/modules/supply/invoices";

export default async function SchoolInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSchoolUser();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice || invoice.schoolId !== user.schoolId || !invoice.delivery) {
    notFound();
  }
  const delivery = invoice.delivery;
  const fromName = invoice.supplier.brandName || invoice.supplier.name;

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header no-print">
        <div className="page-header-main">
          <p className="text-xs text-[var(--muted)]">
            <Link href="/invoices" className="text-[var(--accent)]">
              Invoices
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="page-title">{invoice.invoiceNo}</h1>
            <StatusPill status={invoice.status} />
          </div>
          <p className="page-sub">
            {fromName} · {formatMoney(invoice.amountCents)}
          </p>
        </div>
        <PrintButton label="Print invoice" />
      </header>

      <InvoiceSheet
        invoiceNo={invoice.invoiceNo}
        status={invoice.status}
        amountCents={invoice.amountCents}
        issuedAt={invoice.issuedAt}
        paidAt={invoice.paidAt}
        note={invoice.note}
        fromName={fromName}
        fromSub={invoice.supplier.code}
        toName={invoice.school.name}
        toSub={invoice.school.code}
        deliveryNo={delivery.deliveryNo}
        lines={delivery.lines}
      />

      <section className="card no-print">
        <div className="card-header">
          <div>
            <h2 className="card-title text-base">Payments</h2>
            <p className="card-subtitle">
              Delivery{" "}
              <Link
                href={`/deliveries/${invoice.deliveryId}`}
                className="text-[var(--accent)]"
              >
                {delivery.deliveryNo}
              </Link>
              {" · "}
              Settlement trail from the supplier
            </p>
          </div>
        </div>
        <div className="card-body space-y-2 text-sm">
          {invoice.payments.length === 0 ? (
            <p className="text-[var(--muted)]">No payments recorded yet.</p>
          ) : (
            invoice.payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] bg-[var(--surface-2)] px-3 py-2"
              >
                <div>
                  <div className="font-semibold">
                    {p.paymentNo} · {formatMoney(p.amountCents)}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {p.method}
                    {p.reference ? ` · ${p.reference}` : ""}
                    {" · "}
                    {format(p.createdAt, "dd MMM yyyy HH:mm")}
                  </div>
                </div>
                <StatusPill status={p.status} />
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
