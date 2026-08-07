import { prisma } from "@/lib/db";
import type { IssueDeskSnapshot } from "@/lib/offline-issue-snapshot";

export async function loadIssueDeskData(schoolId: string) {
  const [school, students, kits, items, balances] = await Promise.all([
    prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
    prisma.student.findMany({
      where: { schoolId, active: true },
      orderBy: { admissionNo: "asc" },
      select: {
        id: true,
        admissionNo: true,
        fullName: true,
        className: true,
      },
    }),
    prisma.kit.findMany({
      where: { schoolId, active: true },
      include: {
        lines: {
          include: {
            item: {
              include: { sizes: { select: { sizeLabel: true } } },
            },
          },
        },
      },
    }),
    prisma.item.findMany({
      where: { schoolId, active: true },
      include: { sizes: { select: { sizeLabel: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.stockBalance.findMany({
      where: { schoolId },
      select: { itemId: true, sizeLabel: true, qtyOnHand: true },
    }),
  ]);

  const snapshot: Omit<IssueDeskSnapshot, "savedAt"> = {
    schoolId,
    schoolName: school.name,
    students,
    kits: kits.map((kit) => ({
      id: kit.id,
      name: kit.name,
      lines: kit.lines.map((line) => ({
        itemId: line.itemId,
        qtyDefault: line.qtyDefault,
        item: {
          id: line.item.id,
          name: line.item.name,
          sku: line.item.sku,
          sizes: line.item.sizes,
        },
      })),
    })),
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      sizes: item.sizes,
    })),
    balances,
  };

  return snapshot;
}

export function toIssueDeskSnapshot(
  data: Omit<IssueDeskSnapshot, "savedAt">,
  savedAt = new Date().toISOString(),
): IssueDeskSnapshot {
  return { ...data, savedAt };
}
