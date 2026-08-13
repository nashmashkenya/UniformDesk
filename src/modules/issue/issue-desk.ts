import { prisma } from "@/lib/db";
import type { IssueDeskSnapshot } from "@/lib/offline-issue-snapshot";
import {
  loadStillToReceiveByStudent,
  loadUniformSetsByStudent,
} from "@/modules/issue/outstanding";

async function unitPriceBySku(schoolId: string) {
  const links = await prisma.supplierSchool.findMany({
    where: { schoolId },
    select: { supplierId: true },
  });
  const supplierIds = [...new Set(links.map((l) => l.supplierId))];
  if (!supplierIds.length) return new Map<string, number>();

  const products = await prisma.supplierProduct.findMany({
    where: { supplierId: { in: supplierIds }, active: true },
    select: { sku: true, unitPrice: true },
  });
  const map = new Map<string, number>();
  for (const p of products) {
    map.set(p.sku.toUpperCase(), p.unitPrice);
  }
  return map;
}

export async function loadIssueDeskData(schoolId: string) {
  const studentIdsPromise = prisma.student.findMany({
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
  });

  const [school, students, kits, items, balances, prices] = await Promise.all([
    prisma.school.findUniqueOrThrow({ where: { id: schoolId } }),
    studentIdsPromise,
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
    unitPriceBySku(schoolId),
  ]);

  const ids = students.map((s) => s.id);
  const [stillMap, setMap] = await Promise.all([
    loadStillToReceiveByStudent(schoolId, ids),
    loadUniformSetsByStudent(schoolId, ids),
  ]);

  const priceFor = (sku: string) => prices.get(sku.toUpperCase()) ?? 0;

  const snapshot: Omit<IssueDeskSnapshot, "savedAt"> = {
    schoolId,
    schoolName: school.name,
    students: students.map((s) => {
      const still = stillMap.get(s.id);
      const set = setMap.get(s.id);
      return {
        ...s,
        stillToReceive: still
          ? {
              label: still.label,
              totalOwed: still.totalOwed,
              lines: still.lines,
            }
          : null,
        uniformSet: set
          ? {
              planId: set.planId,
              kitId: set.kitId,
              label: set.label,
              lines: set.lines.map((l) => ({
                ...l,
                unitPriceCents: priceFor(l.sku),
              })),
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
          unitPriceCents: priceFor(line.item.sku),
        },
      })),
    })),
    items: items.map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      sizes: item.sizes,
      unitPriceCents: priceFor(item.sku),
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
