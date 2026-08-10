import { prisma } from "@/lib/db";
import { assertSupplierSchoolLink } from "@/modules/supply/orders";

async function nextDeliveryNo(supplierId: string) {
  const year = new Date().getFullYear();
  const prefix = `DN-${year}-`;
  const latest = await prisma.delivery.findFirst({
    where: { supplierId, deliveryNo: { startsWith: prefix } },
    orderBy: { deliveryNo: "desc" },
    select: { deliveryNo: true },
  });
  const next = latest ? Number(latest.deliveryNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createDelivery(input: {
  supplierId: string;
  schoolId: string;
  actorUserId: string;
  orderId?: string;
  note?: string;
  markInTransit?: boolean;
  lines: { productId: string; sizeLabel: string; qty: number }[];
}) {
  if (!input.lines.length) throw new Error("Add at least one delivery line");
  await assertSupplierSchoolLink(input.supplierId, input.schoolId);

  if (input.orderId) {
    const order = await prisma.supplyOrder.findFirst({
      where: {
        id: input.orderId,
        supplierId: input.supplierId,
        schoolId: input.schoolId,
      },
    });
    if (!order) throw new Error("Order not found");
    if (order.status === "cancelled") {
      throw new Error("Cannot deliver a cancelled order");
    }
  }

  const prepared: {
    productId: string;
    schoolItemId: string | null;
    sizeLabel: string;
    qty: number;
    unitPrice: number;
  }[] = [];
  for (const line of input.lines) {
    if (line.qty <= 0) throw new Error("Quantity must be greater than zero");
    const product = await prisma.supplierProduct.findFirst({
      where: {
        id: line.productId,
        supplierId: input.supplierId,
        active: true,
      },
    });
    if (!product) throw new Error("Product not found");

    const schoolItem = await prisma.item.findFirst({
      where: {
        schoolId: input.schoolId,
        sku: product.sku,
        active: true,
      },
    });

    prepared.push({
      productId: product.id,
      schoolItemId: schoolItem?.id ?? null,
      sizeLabel: line.sizeLabel,
      qty: line.qty,
      unitPrice: product.unitPrice,
    });
  }

  const deliveryNo = await nextDeliveryNo(input.supplierId);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.create({
      data: {
        deliveryNo,
        supplierId: input.supplierId,
        schoolId: input.schoolId,
        orderId: input.orderId || null,
        createdById: input.actorUserId,
        note: input.note?.trim() || null,
        status: input.markInTransit ? "in_transit" : "packed",
        dispatchedAt: input.markInTransit ? now : null,
        lines: { create: prepared },
      },
      include: {
        lines: { include: { product: true, schoolItem: true } },
        school: true,
        supplier: true,
        order: true,
      },
    });

    if (input.orderId) {
      await tx.supplyOrder.update({
        where: { id: input.orderId },
        data: { status: "fulfilled", fulfilledAt: now },
      });
    }

    return delivery;
  });
}

export async function dispatchDelivery(input: {
  deliveryId: string;
  supplierId: string;
}) {
  const delivery = await prisma.delivery.findFirst({
    where: { id: input.deliveryId, supplierId: input.supplierId },
  });
  if (!delivery) throw new Error("Delivery not found");
  if (delivery.status === "delivered") {
    throw new Error("Delivery already received");
  }
  if (delivery.status === "cancelled") {
    throw new Error("Delivery is cancelled");
  }

  return prisma.delivery.update({
    where: { id: delivery.id },
    data: {
      status: "in_transit",
      dispatchedAt: delivery.dispatchedAt ?? new Date(),
    },
  });
}

export async function listSupplierDeliveries(supplierId: string) {
  return prisma.delivery.findMany({
    where: { supplierId },
    include: {
      school: true,
      order: true,
      invoice: true,
      lines: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSchoolDeliveries(schoolId: string) {
  return prisma.delivery.findMany({
    where: { schoolId },
    include: {
      supplier: true,
      order: true,
      receipt: true,
      invoice: true,
      lines: { include: { product: true, schoolItem: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDelivery(id: string) {
  return prisma.delivery.findUnique({
    where: { id },
    include: {
      supplier: true,
      school: true,
      order: true,
      receipt: true,
      invoice: true,
      createdBy: true,
      lines: { include: { product: true, schoolItem: true } },
    },
  });
}

export async function receiveAgainstDelivery(input: {
  schoolId: string;
  actorUserId: string;
  deliveryId: string;
  note?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findFirst({
      where: { id: input.deliveryId, schoolId: input.schoolId },
      include: {
        lines: { include: { product: true, schoolItem: true } },
        supplier: true,
        receipt: true,
      },
    });
    if (!delivery) throw new Error("Delivery not found");
    if (delivery.status === "cancelled") {
      throw new Error("Cannot receive a cancelled delivery");
    }
    if (delivery.status === "delivered" || delivery.receipt) {
      throw new Error("Delivery already received");
    }

    const receiveLines = [];
    for (const line of delivery.lines) {
      let schoolItemId = line.schoolItemId;
      if (!schoolItemId) {
        const matched = await tx.item.findFirst({
          where: {
            schoolId: input.schoolId,
            sku: line.product.sku,
            active: true,
          },
        });
        if (!matched) {
          throw new Error(
            `No school catalog item matches supplier SKU ${line.product.sku}. Add it under Catalog first.`,
          );
        }
        schoolItemId = matched.id;
        await tx.deliveryLine.update({
          where: { id: line.id },
          data: { schoolItemId },
        });
      }

      const sizeExists = await tx.itemSize.findFirst({
        where: { itemId: schoolItemId, sizeLabel: line.sizeLabel },
      });
      if (!sizeExists) {
        await tx.itemSize.create({
          data: { itemId: schoolItemId, sizeLabel: line.sizeLabel },
        });
      }

      receiveLines.push({
        itemId: schoolItemId,
        sizeLabel: line.sizeLabel,
        qty: line.qty,
      });
    }

    const receipt = await tx.inboundReceipt.create({
      data: {
        schoolId: input.schoolId,
        receivedById: input.actorUserId,
        supplierName: delivery.supplier.name,
        note: input.note?.trim() || `Received ${delivery.deliveryNo}`,
        deliveryId: delivery.id,
        lines: {
          create: receiveLines,
        },
      },
    });

    for (const line of receiveLines) {
      await tx.stockLedgerEntry.create({
        data: {
          schoolId: input.schoolId,
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          qtyDelta: line.qty,
          reason: "receive",
          refType: "deliveries",
          refId: delivery.id,
          actorUserId: input.actorUserId,
          note: delivery.deliveryNo,
        },
      });

      await tx.stockBalance.upsert({
        where: {
          schoolId_itemId_sizeLabel: {
            schoolId: input.schoolId,
            itemId: line.itemId,
            sizeLabel: line.sizeLabel,
          },
        },
        create: {
          schoolId: input.schoolId,
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          qtyOnHand: line.qty,
        },
        update: {
          qtyOnHand: { increment: line.qty },
        },
      });
    }

    await tx.delivery.update({
      where: { id: delivery.id },
      data: {
        status: "delivered",
        deliveredAt: new Date(),
        dispatchedAt: delivery.dispatchedAt ?? new Date(),
      },
    });

    return receipt;
  });
}
