import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const SIGNATURE = "data:image/png;base64,testdata";

export function fakeSignature() {
  return SIGNATURE;
}

export async function seedSchoolDesk(opts?: {
  openingQty?: number;
}) {
  const openingQty = opts?.openingQty ?? 10;

  const school = await prisma.school.create({
    data: { name: "Test Secondary", code: `T${Date.now().toString(36)}` },
  });

  const passwordHash = await bcrypt.hash("desk1234", 4);
  const user = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: `store-${school.id}@test.school`,
      name: "Test Storekeeper",
      passwordHash,
      role: "school_reporter",
    },
  });

  const student = await prisma.student.create({
    data: {
      schoolId: school.id,
      admissionNo: "TST-001",
      fullName: "Test Student",
      className: "Form 1",
    },
  });

  const item = await prisma.item.create({
    data: {
      schoolId: school.id,
      sku: "SHIRT-WHT",
      name: "White Shirt",
      category: "shirt",
      sizes: { create: [{ sizeLabel: "M" }] },
    },
  });

  await prisma.stockBalance.create({
    data: {
      schoolId: school.id,
      itemId: item.id,
      sizeLabel: "M",
      qtyOnHand: openingQty,
    },
  });

  return { school, user, student, item, openingQty };
}

export async function seedSupplyChain() {
  const desk = await seedSchoolDesk({ openingQty: 5 });

  const supplier = await prisma.supplier.create({
    data: {
      name: "Test Supply Co",
      code: `S${Date.now().toString(36)}`,
    },
  });

  await prisma.supplierSchool.create({
    data: { supplierId: supplier.id, schoolId: desk.school.id },
  });

  const supplierUser = await prisma.user.create({
    data: {
      supplierId: supplier.id,
      email: `supply-${supplier.id}@test.co`,
      name: "Supplier Admin",
      passwordHash: await bcrypt.hash("desk1234", 4),
      role: "supplier_admin",
    },
  });

  const supplierStaff = await prisma.user.create({
    data: {
      supplierId: supplier.id,
      email: `staff-${supplier.id}@test.co`,
      name: "Supplier Staff",
      passwordHash: await bcrypt.hash("desk1234", 4),
      role: "supplier_staff",
    },
  });

  await prisma.supplierStaffCampus.create({
    data: {
      supplierId: supplier.id,
      userId: supplierStaff.id,
      schoolId: desk.school.id,
    },
  });

  const product = await prisma.supplierProduct.create({
    data: {
      supplierId: supplier.id,
      sku: "SHIRT-WHT",
      name: "White Shirt",
      category: "shirt",
      unitPrice: 10000,
      sizes: { create: [{ sizeLabel: "M" }] },
    },
  });

  return { ...desk, supplier, supplierUser, supplierStaff, product };
}
