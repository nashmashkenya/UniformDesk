import { prisma } from "@/lib/db";

export async function listSchoolPortfolio(supplierId: string) {
  const links = await prisma.supplierSchool.findMany({
    where: { supplierId },
    include: {
      school: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = await Promise.all(
    links.map(async (link) => {
      const [openOrders, openDeliveries, unpaidInvoices, lastDelivery] =
        await Promise.all([
          prisma.supplyOrder.count({
            where: {
              supplierId,
              schoolId: link.schoolId,
              status: { in: ["draft", "confirmed"] },
            },
          }),
          prisma.delivery.count({
            where: {
              supplierId,
              schoolId: link.schoolId,
              status: { in: ["packed", "in_transit"] },
            },
          }),
          prisma.invoice.count({
            where: {
              supplierId,
              schoolId: link.schoolId,
              status: "issued",
            },
          }),
          prisma.delivery.findFirst({
            where: { supplierId, schoolId: link.schoolId },
            orderBy: { createdAt: "desc" },
            select: {
              deliveryNo: true,
              status: true,
              createdAt: true,
            },
          }),
        ]);

      return {
        linkId: link.id,
        school: link.school,
        openOrders,
        openDeliveries,
        unpaidInvoices,
        lastDelivery,
      };
    }),
  );

  return rows;
}

export async function linkSchoolToSupplier(input: {
  supplierId: string;
  schoolCode: string;
}) {
  const code = input.schoolCode.trim().toUpperCase();
  if (!code) throw new Error("School code is required");

  const school = await prisma.school.findFirst({
    where: { code },
  });
  if (!school) throw new Error("No school found with that code");

  try {
    await prisma.supplierSchool.create({
      data: {
        supplierId: input.supplierId,
        schoolId: school.id,
      },
    });
  } catch {
    throw new Error("That school is already linked to your organisation");
  }

  return school;
}

/** Create a school and link it to the supplier (no school login — supplier-operated). */
export async function createSchoolForSupplier(input: {
  supplierId: string;
  name: string;
  code: string;
}) {
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();

  if (!name) throw new Error("School name is required");
  if (!/^[A-Z0-9]{2,12}$/.test(code)) {
    throw new Error("School code must be 2–12 letters or numbers (e.g. GFS)");
  }

  const existingCodes = await prisma.school.findMany({
    select: { code: true },
  });
  if (existingCodes.some((s) => s.code.toUpperCase() === code)) {
    throw new Error("That school code is already in use");
  }

  return prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: { name, code },
    });

    await tx.supplierSchool.create({
      data: {
        supplierId: input.supplierId,
        schoolId: school.id,
      },
    });

    return { school };
  });
}
