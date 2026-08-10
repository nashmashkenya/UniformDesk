import { prisma } from "@/lib/db";
import type { IssueDeskSnapshot } from "@/lib/offline-issue-snapshot";
import { loadStillToReceiveByStudent } from "@/modules/issue/outstanding";

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
        parentName: true,
        parentPhone: true,
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

  const stillMap = await loadStillToReceiveByStudent(
    schoolId,
    students.map((s) => s.id),
  );

  const snapshot: Omit<IssueDeskSnapshot, "savedAt"> = {
    schoolId,
    schoolName: school.name,
    students: students.map((s) => {
      const still = stillMap.get(s.id);
      return {
        ...s,
        stillToReceive: still
          ? {
              label: still.label,
              totalOwed: still.totalOwed,
              lines: still.lines,
            }
          : null,
      };
    }),
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
