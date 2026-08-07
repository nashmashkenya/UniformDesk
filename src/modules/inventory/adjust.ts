import { prisma } from "@/lib/db";

export async function adjustStock(input: {
  schoolId: string;
  actorUserId: string;
  itemId: string;
  sizeLabel: string;
  qtyDelta: number;
  reasonNote: string;
}) {
  const note = input.reasonNote.trim();
  if (!note) throw new Error("Adjustment reason is required");
  if (!Number.isInteger(input.qtyDelta) || input.qtyDelta === 0) {
    throw new Error("Adjustment quantity must be a non-zero integer");
  }

  const item = await prisma.item.findFirst({
    where: {
      id: input.itemId,
      schoolId: input.schoolId,
      active: true,
    },
    include: { sizes: true },
  });
  if (!item) throw new Error("Item not found");

  const sizeLabel = input.sizeLabel.trim();
  if (!item.sizes.some((s) => s.sizeLabel === sizeLabel)) {
    throw new Error(`Size ${sizeLabel} is not on this item`);
  }

  return prisma.$transaction(async (tx) => {
    const balance = await tx.stockBalance.findUnique({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: input.schoolId,
          itemId: input.itemId,
          sizeLabel,
        },
      },
    });
    const onHand = balance?.qtyOnHand ?? 0;
    const next = onHand + input.qtyDelta;
    if (next < 0) {
      throw new Error(
        `Adjustment would make stock negative (on hand ${onHand})`,
      );
    }

    const entry = await tx.stockLedgerEntry.create({
      data: {
        schoolId: input.schoolId,
        itemId: input.itemId,
        sizeLabel,
        qtyDelta: input.qtyDelta,
        reason: "adjust",
        refType: "stock_adjustments",
        actorUserId: input.actorUserId,
        note,
      },
    });

    await tx.stockBalance.upsert({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: input.schoolId,
          itemId: input.itemId,
          sizeLabel,
        },
      },
      create: {
        schoolId: input.schoolId,
        itemId: input.itemId,
        sizeLabel,
        qtyOnHand: next,
      },
      update: {
        qtyOnHand: next,
      },
    });

    // Tie ledger row to itself for audit trail
    return tx.stockLedgerEntry.update({
      where: { id: entry.id },
      data: { refId: entry.id },
    });
  });
}

export async function recentLedger(schoolId: string, take = 30) {
  return prisma.stockLedgerEntry.findMany({
    where: { schoolId },
    include: {
      item: true,
      actor: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take,
  });
}
