import { prisma } from "@/lib/db";

export type ReceiveLineInput = {
  itemId: string;
  sizeLabel: string;
  qty: number;
};

export async function receiveStock(input: {
  schoolId: string;
  actorUserId: string;
  supplierName: string;
  note?: string;
  lines: ReceiveLineInput[];
}) {
  if (!input.lines.length) {
    throw new Error("Add at least one stock line");
  }
  for (const line of input.lines) {
    if (line.qty <= 0) throw new Error("Quantity must be greater than zero");
  }

  return prisma.$transaction(async (tx) => {
    const receipt = await tx.inboundReceipt.create({
      data: {
        schoolId: input.schoolId,
        receivedById: input.actorUserId,
        supplierName: input.supplierName.trim(),
        note: input.note?.trim() || null,
        lines: {
          create: input.lines.map((line) => ({
            itemId: line.itemId,
            sizeLabel: line.sizeLabel,
            qty: line.qty,
          })),
        },
      },
      include: { lines: true },
    });

    for (const line of input.lines) {
      await tx.stockLedgerEntry.create({
        data: {
          schoolId: input.schoolId,
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          qtyDelta: line.qty,
          reason: "receive",
          refType: "inbound_receipts",
          refId: receipt.id,
          actorUserId: input.actorUserId,
          note: input.note?.trim() || null,
        },
      });

      await tx.stockBalance.upsert({
        where: {
          schoolId_itemId_sizeLabel: {
            schoolId: input.schoolId,
            itemId: line.itemId,
            sizeLabel: line.sizeLabel,
          },
        },
        create: {
          schoolId: input.schoolId,
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          qtyOnHand: line.qty,
        },
        update: {
          qtyOnHand: { increment: line.qty },
        },
      });
    }

    return receipt;
  });
}

export async function listBalances(schoolId: string) {
  return prisma.stockBalance.findMany({
    where: { schoolId },
    include: { item: true },
    orderBy: [{ item: { name: "asc" } }, { sizeLabel: "asc" }],
  });
}
