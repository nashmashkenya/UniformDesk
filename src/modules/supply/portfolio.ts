import bcrypt from "bcryptjs";
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

/** Create a school, link it to the supplier, and add a school reporter login. */
export async function createSchoolForSupplier(input: {
  supplierId: string;
  name: string;
  code: string;
  reporterName: string;
  reporterEmail: string;
  reporterPassword: string;
}) {
  const name = input.name.trim();
  const code = input.code.trim().toUpperCase();
  const reporterName = input.reporterName.trim();
  const reporterEmail = input.reporterEmail.trim().toLowerCase();
  const password = input.reporterPassword;

  if (!name) throw new Error("School name is required");
  if (!/^[A-Z0-9]{2,12}$/.test(code)) {
    throw new Error("School code must be 2–12 letters or numbers (e.g. GFS)");
  }
  if (!reporterName) throw new Error("Reporter name is required");
  if (!reporterEmail.includes("@")) {
    throw new Error("Reporter email is required");
  }
  if (password.length < 8) {
    throw new Error("Reporter password must be at least 8 characters");
  }

  const existingCodes = await prisma.school.findMany({
    select: { code: true },
  });
  if (existingCodes.some((s) => s.code.toUpperCase() === code)) {
    throw new Error("That school code is already in use");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: reporterEmail },
  });
  if (existingUser) {
    throw new Error("That reporter email is already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);

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

    const reporter = await tx.user.create({
      data: {
        schoolId: school.id,
        email: reporterEmail,
        name: reporterName,
        passwordHash,
        role: "school_reporter",
      },
    });

    return { school, reporter };
  });
}
