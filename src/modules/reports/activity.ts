import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/db";

export type ActivityKind =
  | "issue"
  | "void"
  | "receive"
  | "delivery_receive"
  | "adjust"
  | "shortage";

export type SupplierActivityKind =
  | "order"
  | "delivery_created"
  | "delivery_dispatch"
  | "delivery_delivered"
  | "invoice_issued"
  | "payment_confirmed";

export type ActivityEvent = {
  id: string;
  at: Date;
  kind: ActivityKind | SupplierActivityKind;
  title: string;
  detail: string;
  href?: string;
  actorName: string | null;
  /** Stable reference for support / audit (slip no, DN, ledger id) */
  correlationId: string;
};

export async function schoolActivityFeed(
  schoolId: string,
  take = 40,
): Promise<ActivityEvent[]> {
  const [slips, ledger] = await Promise.all([
    prisma.issueSlip.findMany({
      where: { schoolId },
      include: {
        student: true,
        issuedBy: { select: { name: true } },
        voidedBy: { select: { name: true } },
        lines: true,
      },
      orderBy: { issuedAt: "desc" },
      take,
    }),
    prisma.stockLedgerEntry.findMany({
      where: {
        schoolId,
        reason: { in: ["receive", "adjust", "shortage"] },
      },
      include: {
        item: true,
        actor: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);

  const events: ActivityEvent[] = [];

  for (const slip of slips) {
    const units = slip.lines.reduce((sum, l) => sum + l.qtyIssued, 0);
    const short = slip.lines.reduce((sum, l) => sum + l.shortageQty, 0);
    events.push({
      id: `issue:${slip.id}`,
      at: slip.issuedAt,
      kind: "issue",
      title: `Issued ${slip.slipNo}`,
      detail: `${slip.student.fullName} · ${units} unit${units === 1 ? "" : "s"}${
        short > 0 ? ` · shortage ${short}` : ""
      }`,
      href: `/slips/${slip.id}`,
      actorName: slip.issuedBy.name,
      correlationId: slip.slipNo,
    });

    if (slip.status === "voided" && slip.voidedAt) {
      events.push({
        id: `void:${slip.id}`,
        at: slip.voidedAt,
        kind: "void",
        title: `Voided ${slip.slipNo}`,
        detail: slip.voidReason || "No reason recorded",
        href: `/slips/${slip.id}`,
        actorName: slip.voidedBy?.name ?? null,
        correlationId: slip.slipNo,
      });
    }
  }

  for (const row of ledger) {
    if (row.reason === "receive") {
      const isDelivery = row.refType === "deliveries";
      events.push({
        id: `ledger:${row.id}`,
        at: row.createdAt,
        kind: isDelivery ? "delivery_receive" : "receive",
        title: isDelivery ? "Supplier delivery received" : "Stock received",
        detail: `${row.item.name} / ${row.sizeLabel} · +${row.qtyDelta}${
          row.note ? ` · ${row.note}` : ""
        }`,
        href: isDelivery && row.refId ? `/deliveries/${row.refId}` : "/stock",
        actorName: row.actor?.name ?? null,
        correlationId: row.refId || row.id,
      });
      continue;
    }

    if (row.reason === "adjust") {
      events.push({
        id: `ledger:${row.id}`,
        at: row.createdAt,
        kind: "adjust",
        title: "Stock adjusted",
        detail: `${row.item.name} / ${row.sizeLabel} · ${
          row.qtyDelta > 0 ? `+${row.qtyDelta}` : row.qtyDelta
        }${row.note ? ` · ${row.note}` : ""}`,
        href: "/stock",
        actorName: row.actor?.name ?? null,
        correlationId: row.id,
      });
      continue;
    }

    if (row.reason === "shortage") {
      events.push({
        id: `ledger:${row.id}`,
        at: row.createdAt,
        kind: "shortage",
        title: "Shortage recorded",
        detail: `${row.item.name} / ${row.sizeLabel}${
          row.note ? ` · ${row.note}` : ""
        }`,
        href: row.refId ? `/slips/${row.refId}` : "/reports",
        actorName: row.actor?.name ?? null,
        correlationId: row.refId || row.id,
      });
    }
  }

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, take);
}

export async function supplierActivityFeed(
  supplierId: string,
  take = 40,
): Promise<ActivityEvent[]> {
  const [orders, deliveries, invoices, payments] = await Promise.all([
    prisma.supplyOrder.findMany({
      where: { supplierId },
      include: {
        school: { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.delivery.findMany({
      where: { supplierId },
      include: {
        school: { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.invoice.findMany({
      where: { supplierId },
      include: {
        school: { select: { name: true, code: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.payment.findMany({
      where: { supplierId, status: "completed" },
      include: {
        school: { select: { name: true, code: true } },
        invoice: { select: { invoiceNo: true } },
        recordedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);

  const events: ActivityEvent[] = [];

  for (const order of orders) {
    events.push({
      id: `order:${order.id}`,
      at: order.createdAt,
      kind: "order",
      title: `Order ${order.orderNo}`,
      detail: `${order.school.name} · ${order.status}`,
      href: `/supplier/orders/${order.id}`,
      actorName: order.createdBy.name,
      correlationId: order.orderNo,
    });
  }

  for (const delivery of deliveries) {
    events.push({
      id: `delivery-created:${delivery.id}`,
      at: delivery.createdAt,
      kind: "delivery_created",
      title: `Packed ${delivery.deliveryNo}`,
      detail: `${delivery.school.name} · ${delivery.status.replaceAll("_", " ")}`,
      href: `/supplier/deliveries/${delivery.id}`,
      actorName: delivery.createdBy.name,
      correlationId: delivery.deliveryNo,
    });

    if (delivery.dispatchedAt) {
      events.push({
        id: `delivery-dispatch:${delivery.id}`,
        at: delivery.dispatchedAt,
        kind: "delivery_dispatch",
        title: `Dispatched ${delivery.deliveryNo}`,
        detail: `${delivery.school.name} · in transit`,
        href: `/supplier/deliveries/${delivery.id}`,
        actorName: delivery.createdBy.name,
        correlationId: delivery.deliveryNo,
      });
    }

    if (delivery.deliveredAt) {
      events.push({
        id: `delivery-delivered:${delivery.id}`,
        at: delivery.deliveredAt,
        kind: "delivery_delivered",
        title: `Delivered ${delivery.deliveryNo}`,
        detail: `${delivery.school.name} · received by school`,
        href: `/supplier/deliveries/${delivery.id}`,
        actorName: null,
        correlationId: delivery.deliveryNo,
      });
    }
  }

  for (const invoice of invoices) {
    if (invoice.issuedAt) {
      events.push({
        id: `invoice:${invoice.id}`,
        at: invoice.issuedAt,
        kind: "invoice_issued",
        title: `Invoiced ${invoice.invoiceNo}`,
        detail: `${invoice.school.name} · ${formatMoney(invoice.amountCents)} · ${invoice.status}`,
        href: `/supplier/invoices/${invoice.id}`,
        actorName: invoice.createdBy.name,
        correlationId: invoice.invoiceNo,
      });
    }
  }

  for (const payment of payments) {
    events.push({
      id: `payment:${payment.id}`,
      at: payment.completedAt ?? payment.createdAt,
      kind: "payment_confirmed",
      title: `Payment confirmed ${payment.paymentNo}`,
      detail: `${payment.school.name} · ${formatMoney(payment.amountCents)} · ${payment.method}${
        payment.invoice ? ` · ${payment.invoice.invoiceNo}` : ""
      }`,
      href: `/supplier/invoices/${payment.invoiceId}`,
      actorName: payment.recordedBy?.name ?? null,
      correlationId: payment.paymentNo,
    });
  }

  return events
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, take);
}
