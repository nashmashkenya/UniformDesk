import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  createInvoiceAction,
  dispatchDeliveryAction,
} from "@/app/actions/supply";
import { DeliveryNoteSheet } from "@/components/delivery-note-sheet";
import { PrintButton } from "@/components/print-button";
import { StatusPill } from "@/components/status-pill";
import { requireSupplierAdmin } from "@/lib/supplier-access";
import { getDelivery } from "@/modules/supply/deliveries";

export default async function SupplierDeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSupplierAdmin();
  const { id } = await params;
  const delivery = await getDelivery(id);
  if (!delivery || delivery.supplierId !== user.supplierId) notFound();

  const showDispatch = delivery.status === "packed";
  const canInvoice =
    !delivery.invoice && delivery.status !== "cancelled";
  const fromName = delivery.supplier.brandName || delivery.supplier.name;

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header no-print">
        <div className="page-header-main">
          <p className="text-xs text-[var(--muted)]">
            <Link href="/supplier/deliveries" className="text-[var(--accent)]">
              Deliveries
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="page-title">{delivery.deliveryNo}</h1>
            <StatusPill status={delivery.status} />
          </div>
          <p className="page-sub">
            {delivery.school.name}
            {delivery.order ? ` · ${delivery.order.orderNo}` : ""}
            {" · "}
            {format(delivery.createdAt, "dd MMM yyyy HH:mm")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showDispatch && (
            <form action={dispatchDeliveryAction}>
              <input type="hidden" name="deliveryId" value={delivery.id} />
              <button type="submit" className="btn btn-primary">
                Mark in transit
              </button>
            </form>
          )}
          {canInvoice && (
            <form action={createInvoiceAction}>
              <input type="hidden" name="deliveryId" value={delivery.id} />
              <button type="submit" className="btn btn-ghost">
                Create invoice
              </button>
            </form>
          )}
          <PrintButton label="Print DN" />
        </div>
      </header>

      <DeliveryNoteSheet
        deliveryNo={delivery.deliveryNo}
        status={delivery.status}
        createdAt={delivery.createdAt}
        dispatchedAt={delivery.dispatchedAt}
        deliveredAt={delivery.deliveredAt}
        note={delivery.note}
        fromName={fromName}
        fromSub={delivery.supplier.code}
        toName={delivery.school.name}
        toSub={delivery.school.code}
        orderNo={delivery.order?.orderNo}
        lines={delivery.lines}
      />

      <section className="card no-print">
        <div className="card-body space-y-2 text-sm">
          {delivery.status === "in_transit" && (
            <p className="text-[var(--muted)]">
              Waiting for school receive on Deliveries.
            </p>
          )}
          {delivery.invoice ? (
            <p>
              Invoice{" "}
              <Link
                href={`/supplier/invoices/${delivery.invoice.id}`}
                className="font-semibold text-[var(--accent)]"
              >
                {delivery.invoice.invoiceNo}
              </Link>
            </p>
          ) : (
            <p className="text-[var(--muted)]">
              Catalog match:{" "}
              {delivery.lines.every((l) => l.schoolItem)
                ? "All lines matched"
                : "Some lines pending school SKU match"}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
