import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { DeliveryNoteSheet } from "@/components/delivery-note-sheet";
import { PrintButton } from "@/components/print-button";
import { ReceiveDeliveryForm } from "@/components/receive-delivery-form";
import { StatusPill } from "@/components/status-pill";
import { canWrite, requireSchoolUser } from "@/lib/auth";
import { getDelivery } from "@/modules/supply/deliveries";

export default async function SchoolDeliveryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSchoolUser();
  const { id } = await params;
  const delivery = await getDelivery(id);
  if (!delivery || delivery.schoolId !== user.schoolId) notFound();

  const writable = canWrite(user.role);
  const canReceive =
    writable &&
    delivery.status !== "delivered" &&
    delivery.status !== "cancelled" &&
    !delivery.receipt;
  const fromName = delivery.supplier.brandName || delivery.supplier.name;

  return (
    <div className="page-stack mx-auto max-w-3xl">
      <header className="page-header no-print">
        <div className="page-header-main">
          <p className="text-xs text-[var(--muted)]">
            <Link href="/deliveries" className="text-[var(--accent)]">
              Deliveries
            </Link>
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="page-title">{delivery.deliveryNo}</h1>
            <StatusPill status={delivery.status} />
          </div>
          <p className="page-sub">
            {fromName} · {format(delivery.createdAt, "dd MMM yyyy HH:mm")}
          </p>
        </div>
        <PrintButton label="Print DN" />
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

      {canReceive && (
        <section className="card no-print">
          <div className="card-header">
            <div>
              <h2 className="card-title text-base">Receive into stock</h2>
              <p className="card-subtitle">
                Posts ledger receive lines and creates an inbound receipt
              </p>
            </div>
          </div>
          <div className="card-body">
            <ReceiveDeliveryForm deliveryId={delivery.id} />
          </div>
        </section>
      )}

      {delivery.receipt && (
        <section className="card no-print">
          <div className="card-body text-sm">
            Received{" "}
            {format(delivery.receipt.receivedAt, "dd MMM yyyy HH:mm")}
            {delivery.receipt.note ? ` · ${delivery.receipt.note}` : ""}
          </div>
        </section>
      )}

      {!canReceive && !delivery.receipt && (
        <section className="card no-print">
          <div className="card-body text-sm text-[var(--muted)]">
            Catalog match:{" "}
            {delivery.lines.every((l) => l.schoolItem)
              ? "All lines matched"
              : "Some lines need a matching school SKU before receive"}
          </div>
        </section>
      )}
    </div>
  );
}
