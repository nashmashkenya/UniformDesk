import { prisma } from "@/lib/db";
import { recordManualPayment } from "@/modules/payments/payments";

async function nextInvoiceNo(supplierId: string) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const latest = await prisma.invoice.findFirst({
    where: { supplierId, invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: "desc" },
    select: { invoiceNo: true },
  });
  const next = latest ? Number(latest.invoiceNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createInvoiceFromDelivery(input: {
  supplierId: string;
  actorUserId: string;
  deliveryId: string;
  note?: string;
}) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: input.deliveryId, supplierId: input.supplierId },
    include: { lines: true, invoice: true },
  });
  if (!delivery) throw new Error("Delivery not found");
  if (delivery.invoice) throw new Error("Invoice already exists for delivery");
  if (delivery.status === "cancelled") {
    throw new Error("Cannot invoice a cancelled delivery");
  }

  const amountCents = delivery.lines.reduce(
    (sum, line) => sum + line.qty * line.unitPrice,
    0,
  );
  const invoiceNo = await nextInvoiceNo(input.supplierId);
  const now = new Date();

  return prisma.invoice.create({
    data: {
      invoiceNo,
      supplierId: input.supplierId,
      schoolId: delivery.schoolId,
      deliveryId: delivery.id,
      createdById: input.actorUserId,
      amountCents,
      note: input.note?.trim() || null,
      status: "issued",
      issuedAt: now,
    },
    include: {
      school: true,
      delivery: true,
    },
  });
}

export async function markInvoicePaid(input: {
  invoiceId: string;
  supplierId: string;
  actorUserId: string;
  method?: "cash" | "bank" | "other";
  reference?: string;
}) {
  await recordManualPayment({
    supplierId: input.supplierId,
    actorUserId: input.actorUserId,
    invoiceId: input.invoiceId,
    method: input.method ?? "cash",
    reference: input.reference,
    note: "Marked paid",
  });
  return prisma.invoice.findUniqueOrThrow({ where: { id: input.invoiceId } });
}

export async function listSupplierInvoices(supplierId: string) {
  return prisma.invoice.findMany({
    where: { supplierId },
    include: { school: true, delivery: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSchoolInvoices(schoolId: string) {
  return prisma.invoice.findMany({
    where: { schoolId },
    include: { supplier: true, delivery: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: {
      supplier: true,
      school: true,
      delivery: {
        include: {
          lines: { include: { product: true } },
        },
      },
      createdBy: true,
      payments: {
        orderBy: { createdAt: "desc" },
        include: { recordedBy: { select: { name: true } } },
      },
    },
  });
}
