import { execSync } from "node:child_process";
import path from "node:path";
import { afterAll, beforeEach } from "vitest";

/** Postgres URL for tests (Docker Compose default DB is fine). */
const dbUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/uniformdesk?schema=public";

process.env.DATABASE_URL = dbUrl;
process.env.AUTH_SECRET = "test-auth-secret-uniformdesk";

const root = path.resolve(__dirname, "..");

execSync("npx prisma migrate deploy", {
  cwd: root,
  stdio: "pipe",
  env: { ...process.env, DATABASE_URL: dbUrl },
});

beforeEach(async () => {
  const { prisma } = await import("@/lib/db");

  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.deliveryLine.deleteMany();
  await prisma.inboundLine.deleteMany();
  await prisma.inboundReceipt.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.supplyOrderLine.deleteMany();
  await prisma.supplyOrder.deleteMany();
  await prisma.issueLine.deleteMany();
  await prisma.issueSlip.deleteMany();
  await prisma.studentUniformPlanLine.deleteMany();
  await prisma.studentUniformPlan.deleteMany();
  await prisma.stockLedgerEntry.deleteMany();
  await prisma.stockBalance.deleteMany();
  await prisma.kitLine.deleteMany();
  await prisma.kit.deleteMany();
  await prisma.supplierProductSize.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.supplierStaffCampus.deleteMany();
  await prisma.supplierSchool.deleteMany();
  await prisma.itemSize.deleteMany();
  await prisma.item.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.school.deleteMany();
});

afterAll(async () => {
  const { prisma } = await import("@/lib/db");
  await prisma.$disconnect();
});
