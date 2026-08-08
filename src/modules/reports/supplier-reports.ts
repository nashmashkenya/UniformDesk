import { prisma } from "@/lib/db";
import { assertSupplierSchoolLink } from "@/modules/supply/orders";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Issued at a linked school (default: today). */
export async function listSchoolIssuedForSupplier(input: {
  supplierId: string;
  schoolId: string;
  /** If omitted, issued since midnight */
  from?: Date;
  take?: number;
}) {
  await assertSupplierSchoolLink(input.supplierId, input.schoolId);
  const from = input.from ?? startOfToday();
  const take = input.take ?? 80;

  return prisma.issueSlip.findMany({
    where: {
      schoolId: input.schoolId,
      issuedAt: { gte: from },
    },
    include: {
      student: {
        select: {
          id: true,
          fullName: true,
          admissionNo: true,
          className: true,
        },
      },
      issuedBy: {
        select: {
          id: true,
          name: true,
          role: true,
          supplierId: true,
        },
      },
      lines: {
        include: { item: { select: { id: true, name: true, sku: true } } },
      },
    },
    orderBy: { issuedAt: "desc" },
    take,
  });
}

/** Read-only campus stock for a linked school. */
export async function listSchoolStockForSupplier(input: {
  supplierId: string;
  schoolId: string;
}) {
  await assertSupplierSchoolLink(input.supplierId, input.schoolId);

  return prisma.stockBalance.findMany({
    where: { schoolId: input.schoolId },
    include: {
      item: { select: { id: true, name: true, sku: true, category: true } },
    },
    orderBy: [{ item: { name: "asc" } }, { sizeLabel: "asc" }],
  });
}

export async function supplierReportStats(input: {
  supplierId: string;
  schoolId: string;
}) {
  await assertSupplierSchoolLink(input.supplierId, input.schoolId);
  const today = startOfToday();

  const [issuedToday, stillOwedPlans, lowStock, balanceLines] =
    await Promise.all([
      prisma.issueSlip.count({
        where: {
          schoolId: input.schoolId,
          status: "issued",
          issuedAt: { gte: today },
        },
      }),
      prisma.studentUniformPlan.count({
        where: { schoolId: input.schoolId, status: "open" },
      }),
      prisma.stockBalance.count({
        where: { schoolId: input.schoolId, qtyOnHand: { lte: 5 } },
      }),
      prisma.stockBalance.count({
        where: { schoolId: input.schoolId },
      }),
    ]);

  return { issuedToday, stillOwedPlans, lowStock, balanceLines };
}
