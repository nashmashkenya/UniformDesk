import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { cancelPaymentAction } from "@/app/actions/payments";
import { markInvoicePaidAction } from "@/app/actions/supply";
import { InvoiceSheet } from "@/components/invoice-sheet";
import {
  MpesaPaymentForm,
  RecordPaymentForm,
} from "@/components/payment-forms";
import { PrintButton } from "@/components/print-button";
import { StatusPill } from "@/components/status-pill";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { formatMoney } from "@/lib/money";
import { appBaseUrl } from "@/lib/url";
import { getInvoice } from "@/modules/supply/invoices";

export default async function SupplierInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSupplierAdmin();
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice || invoice.supplierId !== user.supplierId || !invoice.delivery) {
    notFound();
  }
  const delivery = invoice.delivery;
  const canCollect = invoice.status === "issued";
  const fromName = invoice.supplier.brandName || invoice.supplier.name;

  const paidCents = invoice.payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const remainingCents = Math.max(0, invoice.amountCents - paidCents);
  const remainingKes = Math.round(remainingCents / 100);

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header no-print">
        <div className="page-header-main">
          <p className="text-xs text-[var(--muted)]">
            <Link href="/supplier/invoices" className="text-[var(--accent)]">
              Invoices
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="page-title">{invoice.invoiceNo}</h1>
            <StatusPill status={invoice.status} />
          </div>
          <p className="page-sub">
            {invoice.school.name} · {formatMoney(invoice.amountCents)}
            {remainingCents > 0 && remainingCents < invoice.amountCents
              ? ` · Remaining ${formatMoney(remainingCents)}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCollect && remainingCents > 0 && (
            <form action={markInvoicePaidAction}>
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <input type="hidden" name="method" value="cash" />
              <button type="submit" className="btn btn-ghost">
                Quick mark paid (cash)
              </button>
            </form>
          )}
          <PrintButton label="Print invoice" />
        </div>
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
                href={`/supplier/deliveries/${invoice.deliveryId}`}
                className="text-[var(--accent)]"
              >
                {delivery.deliveryNo}
              </Link>
              {" · "}
              Manual settle or M-Pesa STK (sandbox adapter)
            </p>
          </div>
        </div>
        <div className="card-body space-y-4">
          {invoice.payments.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No payments yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {invoice.payments.map((p) => (
                <li
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
                      {p.phone ? ` · ${p.phone}` : ""}
                      {" · "}
                      {format(p.createdAt, "dd MMM HH:mm")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={p.status} />
                    {canCollect && p.status === "pending" && (
                      <>
                        <a
                          href={`${appBaseUrl()}/api/v1/payments/mpesa/callback?providerRef=${encodeURIComponent(p.providerRef ?? "")}&simulate=success`}
                          className="btn btn-ghost text-xs"
                        >
                          Complete
                        </a>
                        <form action={cancelPaymentAction}>
                          <input type="hidden" name="paymentId" value={p.id} />
                          <input
                            type="hidden"
                            name="invoiceId"
                            value={invoice.id}
                          />
                          <button
                            type="submit"
                            className="btn btn-ghost text-xs text-[var(--danger)]"
                          >
                            Cancel
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {canCollect && remainingCents > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card-inset">
                <div className="section-label mb-2">Record payment</div>
                <RecordPaymentForm
                  invoiceId={invoice.id}
                  remainingKes={remainingKes}
                />
              </div>
              <div className="card-inset">
                <div className="section-label mb-2">M-Pesa STK</div>
                <MpesaPaymentForm invoiceId={invoice.id} />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
