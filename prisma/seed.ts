import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.issueLine.deleteMany();
  await prisma.issueSlip.deleteMany();
  await prisma.inboundLine.deleteMany();
  await prisma.inboundReceipt.deleteMany();
  await prisma.deliveryLine.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.supplyOrderLine.deleteMany();
  await prisma.supplyOrder.deleteMany();
  await prisma.supplierProductSize.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.supplierStaffCampus.deleteMany();
  await prisma.supplierSchool.deleteMany();
  await prisma.stockLedgerEntry.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.kitLine.deleteMany();
  await prisma.kit.deleteMany();
  await prisma.itemSize.deleteMany();
  await prisma.item.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.school.deleteMany();

  const school = await prisma.school.create({
    data: {
      name: "Greenfield Secondary School",
      code: "GFS",
      schoolMasterExternalId: "sm-greenfield-001",
    },
  });

  const riverside = await prisma.school.create({
    data: {
      name: "Riverside Academy",
      code: "RVA",
      schoolMasterExternalId: "sm-riverside-001",
    },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: "UniformDesk Supply Co.",
      code: "UDS",
      brandName: "CampusKit Supply",
      brandPrimary: "#0b6e4f",
      brandMark: "CK",
      supportEmail: "hello@campuskitsupply.co",
      supportPhone: "+254 700 000 000",
    },
  });

  await prisma.supplierSchool.create({
    data: { supplierId: supplier.id, schoolId: school.id },
  });
  await prisma.supplierSchool.create({
    data: { supplierId: supplier.id, schoolId: riverside.id },
  });

  const passwordHash = await bcrypt.hash("desk1234", 10);

  const reporter = await prisma.user.create({
    data: {
      schoolId: school.id,
      email: "report@greenfield.school",
      name: "John Kamau",
      passwordHash,
      role: "school_reporter",
    },
  });

  await prisma.user.create({
    data: {
      supplierId: supplier.id,
      email: "supply@uniformdesk.co",
      name: "Sarah Mutiso",
      passwordHash,
      role: "supplier_admin",
    },
  });

  const staff = await prisma.user.create({
    data: {
      supplierId: supplier.id,
      email: "staff@uniformdesk.co",
      name: "Kevin Njoroge",
      passwordHash,
      role: "supplier_staff",
    },
  });

  // Demo: staff assigned to Greenfield only (admin still sees GFS + RVA)
  await prisma.supplierStaffCampus.create({
    data: {
      supplierId: supplier.id,
      userId: staff.id,
      schoolId: school.id,
    },
  });

  await prisma.user.create({
    data: {
      schoolId: riverside.id,
      email: "report@riverside.school",
      name: "Lucy Aoko",
      passwordHash,
      role: "school_reporter",
    },
  });

  const students = [
    { admissionNo: "GFS-001", fullName: "Brian Mwangi", className: "Form 1A" },
    { admissionNo: "GFS-002", fullName: "Faith Achieng", className: "Form 1A" },
    { admissionNo: "GFS-003", fullName: "Daniel Kiprop", className: "Form 2B" },
    { admissionNo: "GFS-004", fullName: "Mary Njeri", className: "Form 2B" },
    { admissionNo: "GFS-005", fullName: "Peter Ouma", className: "Form 3C" },
  ];

  for (const student of students) {
    await prisma.student.create({
      data: { schoolId: school.id, ...student },
    });
  }

  const shirt = await prisma.item.create({
    data: {
      schoolId: school.id,
      sku: "SHIRT-WHT",
      name: "White Shirt",
      category: "shirt",
      sizes: { create: [{ sizeLabel: "S" }, { sizeLabel: "M" }, { sizeLabel: "L" }] },
    },
  });

  const trouser = await prisma.item.create({
    data: {
      schoolId: school.id,
      sku: "TRS-GRY",
      name: "Grey Trouser",
      category: "trouser",
      sizes: { create: [{ sizeLabel: "28" }, { sizeLabel: "30" }, { sizeLabel: "32" }] },
    },
  });

  const sweater = await prisma.item.create({
    data: {
      schoolId: school.id,
      sku: "SWT-NVY",
      name: "Navy Sweater",
      category: "sweater",
      sizes: { create: [{ sizeLabel: "S" }, { sizeLabel: "M" }, { sizeLabel: "L" }] },
    },
  });

  await prisma.kit.create({
    data: {
      schoolId: school.id,
      name: "Form 1 Starter Kit",
      academicYear: "2026",
      lines: {
        create: [
          { itemId: shirt.id, qtyDefault: 2 },
          { itemId: trouser.id, qtyDefault: 2 },
          { itemId: sweater.id, qtyDefault: 1 },
        ],
      },
    },
  });

  const opening = [
    { itemId: shirt.id, sizeLabel: "S", qty: 20 },
    { itemId: shirt.id, sizeLabel: "M", qty: 30 },
    { itemId: shirt.id, sizeLabel: "L", qty: 15 },
    { itemId: trouser.id, sizeLabel: "28", qty: 18 },
    { itemId: trouser.id, sizeLabel: "30", qty: 25 },
    { itemId: trouser.id, sizeLabel: "32", qty: 12 },
    { itemId: sweater.id, sizeLabel: "S", qty: 10 },
    { itemId: sweater.id, sizeLabel: "M", qty: 14 },
    { itemId: sweater.id, sizeLabel: "L", qty: 8 },
  ];

  const receipt = await prisma.inboundReceipt.create({
    data: {
      schoolId: school.id,
      receivedById: reporter.id,
      supplierName: "UniformDesk Supply Co.",
      note: "Opening stock",
      lines: {
        create: opening.map((line) => ({
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          qty: line.qty,
        })),
      },
    },
  });

  for (const line of opening) {
    await prisma.stockBalance.create({
      data: {
        schoolId: school.id,
        itemId: line.itemId,
        sizeLabel: line.sizeLabel,
        qtyOnHand: line.qty,
      },
    });
    await prisma.stockLedgerEntry.create({
      data: {
        schoolId: school.id,
        itemId: line.itemId,
        sizeLabel: line.sizeLabel,
        qtyDelta: line.qty,
        reason: "receive",
        refType: "inbound_receipts",
        refId: receipt.id,
        actorUserId: reporter.id,
        note: "Opening stock",
      },
    });
  }

  await prisma.student.create({
    data: {
      schoolId: riverside.id,
      admissionNo: "RVA-001",
      fullName: "Ian Otieno",
      className: "Grade 7",
    },
  });

  await prisma.item.create({
    data: {
      schoolId: riverside.id,
      sku: "SHIRT-WHT",
      name: "White Shirt",
      category: "shirt",
      sizes: { create: [{ sizeLabel: "S" }, { sizeLabel: "M" }, { sizeLabel: "L" }] },
    },
  });
  await prisma.item.create({
    data: {
      schoolId: riverside.id,
      sku: "TRS-GRY",
      name: "Grey Trouser",
      category: "trouser",
      sizes: { create: [{ sizeLabel: "28" }, { sizeLabel: "30" }, { sizeLabel: "32" }] },
    },
  });
  await prisma.item.create({
    data: {
      schoolId: riverside.id,
      sku: "SWT-NVY",
      name: "Navy Sweater",
      category: "sweater",
      sizes: { create: [{ sizeLabel: "S" }, { sizeLabel: "M" }, { sizeLabel: "L" }] },
    },
  });

  await prisma.supplierProduct.create({
    data: {
      supplierId: supplier.id,
      sku: "SHIRT-WHT",
      name: "White Shirt",
      category: "shirt",
      unitPrice: 85000,
      sizes: { create: [{ sizeLabel: "S" }, { sizeLabel: "M" }, { sizeLabel: "L" }] },
    },
  });

  await prisma.supplierProduct.create({
    data: {
      supplierId: supplier.id,
      sku: "TRS-GRY",
      name: "Grey Trouser",
      category: "trouser",
      unitPrice: 120000,
      sizes: { create: [{ sizeLabel: "28" }, { sizeLabel: "30" }, { sizeLabel: "32" }] },
    },
  });

  await prisma.supplierProduct.create({
    data: {
      supplierId: supplier.id,
      sku: "SWT-NVY",
      name: "Navy Sweater",
      category: "sweater",
      unitPrice: 150000,
      sizes: { create: [{ sizeLabel: "S" }, { sizeLabel: "M" }, { sizeLabel: "L" }] },
    },
  });

  console.log("Seed complete");
  console.log("Schools (data):", school.name, "+", riverside.name);
  console.log("Supplier admin: supply@uniformdesk.co / desk1234");
  console.log("Supplier staff: staff@uniformdesk.co / desk1234 (campus: GFS)");
  console.log("Note: school operational login is closed in Phase 1");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
