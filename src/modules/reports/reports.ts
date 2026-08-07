import { prisma } from "@/lib/db";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function deskStats(schoolId: string) {
  const today = startOfToday();
  const [issuedToday, voidedToday, shortageLines, lowStock] = await Promise.all([
    prisma.issueSlip.count({
      where: { schoolId, status: "issued", issuedAt: { gte: today } },
    }),
    prisma.issueSlip.count({
      where: { schoolId, status: "voided", voidedAt: { gte: today } },
    }),
    prisma.issueLine.count({
      where: {
        shortageQty: { gt: 0 },
        slip: { schoolId, status: "issued", issuedAt: { gte: today } },
      },
    }),
    prisma.stockBalance.count({
      where: { schoolId, qtyOnHand: { lte: 5 } },
    }),
  ]);

  return { issuedToday, voidedToday, shortageLines, lowStock };
}

export async function issuedToday(schoolId: string) {
  const today = startOfToday();
  return prisma.issueSlip.findMany({
    where: { schoolId, issuedAt: { gte: today } },
    include: {
      student: true,
      issuedBy: true,
      lines: { include: { item: true } },
    },
    orderBy: { issuedAt: "desc" },
  });
}

export async function shortageReport(schoolId: string) {
  return prisma.issueLine.findMany({
    where: {
      shortageQty: { gt: 0 },
      slip: { schoolId, status: "issued" },
    },
    include: {
      item: true,
      slip: { include: { student: true } },
    },
    orderBy: { slip: { issuedAt: "desc" } },
    take: 100,
  });
}

export async function getSchoolStudent(schoolId: string, studentId: string) {
  return prisma.student.findFirst({
    where: { id: studentId, schoolId },
  });
}

export async function studentHistory(schoolId: string, studentId: string) {
  return prisma.issueSlip.findMany({
    where: { schoolId, studentId },
    include: {
      lines: { include: { item: true } },
      issuedBy: true,
      voidedBy: true,
    },
    orderBy: { issuedAt: "desc" },
  });
}

export async function auditExportRows(
  schoolId: string,
  from: Date,
  to: Date,
) {
  return prisma.issueSlip.findMany({
    where: {
      schoolId,
      issuedAt: { gte: from, lte: to },
    },
    include: {
      student: true,
      issuedBy: true,
      voidedBy: true,
      lines: { include: { item: true } },
      school: true,
    },
    orderBy: { issuedAt: "asc" },
  });
}

function csvEscape(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

export function slipsToAuditCsv(
  rows: Awaited<ReturnType<typeof auditExportRows>>,
) {
  const header = [
    "slip_no",
    "status",
    "issued_at",
    "student_admission",
    "student_name",
    "class",
    "issued_by",
    "ack_name",
    "item_sku",
    "item_name",
    "size",
    "qty_requested",
    "qty_issued",
    "shortage_qty",
    "voided_at",
    "void_reason",
    "voided_by",
    "public_token",
  ];

  const lines = [header.join(",")];
  for (const slip of rows) {
    for (const line of slip.lines) {
      lines.push(
        [
          slip.slipNo,
          slip.status,
          slip.issuedAt.toISOString(),
          slip.student.admissionNo,
          slip.student.fullName,
          slip.student.className ?? "",
          slip.issuedBy.name,
          slip.acknowledgmentName,
          line.item.sku,
          line.item.name,
          line.sizeLabel,
          line.qtyRequested,
          line.qtyIssued,
          line.shortageQty,
          slip.voidedAt?.toISOString() ?? "",
          slip.voidReason ?? "",
          slip.voidedBy?.name ?? "",
          slip.publicToken,
        ]
          .map(csvEscape)
          .join(","),
      );
    }
  }
  return `${lines.join("\n")}\n`;
}
