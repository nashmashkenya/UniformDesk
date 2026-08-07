import { prisma } from "@/lib/db";

async function nextOrderNo(supplierId: string) {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;
  const latest = await prisma.supplyOrder.findFirst({
    where: { supplierId, orderNo: { startsWith: prefix } },
    orderBy: { orderNo: "desc" },
    select: { orderNo: true },
  });
  const next = latest ? Number(latest.orderNo.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function assertSupplierSchoolLink(
  supplierId: string,
  schoolId: string,
) {
  const link = await prisma.supplierSchool.findUnique({
    where: {
      supplierId_schoolId: { supplierId, schoolId },
    },
  });
  if (!link) throw new Error("School is not linked to this supplier");
}

export async function createOrder(input: {
  supplierId: string;
  schoolId: string;
  actorUserId: string;
  note?: string;
  lines: { productId: string; sizeLabel: string; qty: number }[];
}) {
  if (!input.lines.length) throw new Error("Add at least one order line");
  await assertSupplierSchoolLink(input.supplierId, input.schoolId);

  const prepared = [];
  for (const line of input.lines) {
    if (line.qty <= 0) throw new Error("Quantity must be greater than zero");
    const product = await prisma.supplierProduct.findFirst({
      where: {
        id: line.productId,
        supplierId: input.supplierId,
        active: true,
      },
      include: { sizes: true },
    });
    if (!product) throw new Error("Product not found");
    if (!product.sizes.some((s) => s.sizeLabel === line.sizeLabel)) {
      throw new Error(`Size ${line.sizeLabel} not available for ${product.name}`);
    }
    prepared.push({
      productId: product.id,
      sizeLabel: line.sizeLabel,
      qty: line.qty,
      unitPrice: product.unitPrice,
    });
  }

  const orderNo = await nextOrderNo(input.supplierId);
  return prisma.supplyOrder.create({
    data: {
      orderNo,
      supplierId: input.supplierId,
      schoolId: input.schoolId,
      createdById: input.actorUserId,
      note: input.note?.trim() || null,
      status: "confirmed",
      confirmedAt: new Date(),
      lines: { create: prepared },
    },
    include: {
      lines: { include: { product: true } },
      school: true,
      supplier: true,
    },
  });
}

export async function listSupplierOrders(supplierId: string) {
  return prisma.supplyOrder.findMany({
    where: { supplierId },
    include: {
      school: true,
      lines: { include: { product: true } },
      deliveries: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listSchoolOrders(schoolId: string) {
  return prisma.supplyOrder.findMany({
    where: { schoolId },
    include: {
      supplier: true,
      lines: { include: { product: true } },
      deliveries: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrder(id: string) {
  return prisma.supplyOrder.findUnique({
    where: { id },
    include: {
      school: true,
      supplier: true,
      lines: { include: { product: true } },
      deliveries: true,
      createdBy: true,
    },
  });
}

export async function cancelOrder(input: {
  orderId: string;
  supplierId?: string;
  schoolId?: string;
}) {
  const order = await prisma.supplyOrder.findFirst({
    where: {
      id: input.orderId,
      ...(input.supplierId ? { supplierId: input.supplierId } : {}),
      ...(input.schoolId ? { schoolId: input.schoolId } : {}),
    },
  });
  if (!order) throw new Error("Order not found");
  if (order.status === "fulfilled") {
    throw new Error("Fulfilled orders cannot be cancelled");
  }
  if (order.status === "cancelled") throw new Error("Order already cancelled");

  return prisma.supplyOrder.update({
    where: { id: order.id },
    data: { status: "cancelled" },
  });
}
