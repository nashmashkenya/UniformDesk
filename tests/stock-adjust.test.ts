import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { adjustStock } from "@/modules/inventory/adjust";
import { seedSchoolDesk } from "./helpers/fixtures";

describe("stock adjustment invariants", () => {
  it("requires a reason and posts an adjust ledger entry", async () => {
    const desk = await seedSchoolDesk({ openingQty: 10 });

    await expect(
      adjustStock({
        schoolId: desk.school.id,
        actorUserId: desk.user.id,
        itemId: desk.item.id,
        sizeLabel: "M",
        qtyDelta: -2,
        reasonNote: "  ",
      }),
    ).rejects.toThrow(/reason/i);

    await adjustStock({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      itemId: desk.item.id,
      sizeLabel: "M",
      qtyDelta: -2,
      reasonNote: "Damaged in store",
    });

    const balance = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: desk.school.id,
          itemId: desk.item.id,
          sizeLabel: "M",
        },
      },
    });
    expect(balance.qtyOnHand).toBe(8);

    const entry = await prisma.stockLedgerEntry.findFirst({
      where: {
        schoolId: desk.school.id,
        reason: "adjust",
        itemId: desk.item.id,
      },
    });
    expect(entry?.qtyDelta).toBe(-2);
    expect(entry?.note).toBe("Damaged in store");
  });

  it("blocks adjustments that would make stock negative", async () => {
    const desk = await seedSchoolDesk({ openingQty: 3 });

    await expect(
      adjustStock({
        schoolId: desk.school.id,
        actorUserId: desk.user.id,
        itemId: desk.item.id,
        sizeLabel: "M",
        qtyDelta: -5,
        reasonNote: "Bad count",
      }),
    ).rejects.toThrow(/negative/i);
  });
});
