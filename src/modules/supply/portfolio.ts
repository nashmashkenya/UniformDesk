import { prisma } from "@/lib/db";

export async function listSchoolPortfolio(supplierId: string) {
  const links = await prisma.supplierSchool.findMany({
    where: { supplierId },
    include: { school: true },
    orderBy: { school: { name: "asc" } },
  });

  const portfolio = await Promise.all(
    links.map(async (link) => {
      const schoolId = link.schoolId;
      const [
        openOrders,
        openDeliveries,
        unpaidInvoices,
        lastOrder,
        lastDelivery,
      ] = await Promise.all([
        prisma.supplyOrder.count({
          where: {
            supplierId,
            schoolId,
            status: { in: ["draft", "confirmed"] },
          },
        }),
        prisma.delivery.count({
          where: {
            supplierId,
            schoolId,
            status: { in: ["packed", "in_transit"] },
          },
        }),
        prisma.invoice.count({
          where: { supplierId, schoolId, status: "issued" },
        }),
        prisma.supplyOrder.findFirst({
          where: { supplierId, schoolId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, orderNo: true },
        }),
        prisma.delivery.findFirst({
          where: { supplierId, schoolId },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, deliveryNo: true, status: true },
        }),
      ]);

      return {
        linkId: link.id,
        school: link.school,
        openOrders,
        openDeliveries,
        unpaidInvoices,
        lastOrder,
        lastDelivery,
      };
    }),
  );

  return portfolio;
}

export async function linkSchoolToSupplier(input: {
  supplierId: string;
  schoolCode: string;
}) {
  const code = input.schoolCode.trim().toUpperCase();
  if (!code) throw new Error("School code is required");

  const school = await prisma.school.findUnique({ where: { code } });
  if (!school) throw new Error("School not found for that code");

  try {
    return await prisma.supplierSchool.create({
      data: {
        supplierId: input.supplierId,
        schoolId: school.id,
      },
      include: { school: true },
    });
  } catch {
    throw new Error("School is already linked");
  }
}
