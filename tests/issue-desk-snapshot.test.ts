import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { applyIssueToBalances } from "@/lib/offline-issue-snapshot";
import { issueKit } from "@/modules/issue/issue";
import { loadIssueDeskData } from "@/modules/issue/issue-desk";
import { seedSchoolDesk, seedSupplyChain } from "./helpers/fixtures";

describe("issue desk snapshot", () => {
  it("loads students, kits catalog items, and balances for a school", async () => {
    const desk = await seedSchoolDesk();
    const snap = await loadIssueDeskData(desk.school.id);

    expect(snap.schoolId).toBe(desk.school.id);
    expect(snap.students.some((s) => s.id === desk.student.id)).toBe(true);
    expect(snap.items.some((i) => i.id === desk.item.id)).toBe(true);
    expect(
      snap.balances.some(
        (b) =>
          b.itemId === desk.item.id &&
          b.sizeLabel === "M" &&
          b.qtyOnHand === desk.openingQty,
      ),
    ).toBe(true);
  });

  it("applies queued issue deltas without going negative", () => {
    const next = applyIssueToBalances(
      [
        { itemId: "a", sizeLabel: "M", qtyOnHand: 3 },
        { itemId: "a", sizeLabel: "L", qtyOnHand: 1 },
      ],
      [
        { itemId: "a", sizeLabel: "M", qtyRequested: 5 },
        { itemId: "a", sizeLabel: "L", qtyRequested: 1 },
      ],
    );

    expect(next.find((b) => b.sizeLabel === "M")?.qtyOnHand).toBe(0);
    expect(next.find((b) => b.sizeLabel === "L")?.qtyOnHand).toBe(0);
  });

  it("attaches list prices and the full given / not-given set", async () => {
    const chain = await seedSupplyChain();
    await prisma.kit.create({
      data: {
        schoolId: chain.school.id,
        name: "Form 1 Kit",
        academicYear: "2026",
        lines: { create: [{ itemId: chain.item.id, qtyDefault: 1 }] },
      },
    });
    const extra = await prisma.item.create({
      data: {
        schoolId: chain.school.id,
        sku: "SOCK-NVY",
        name: "Navy Socks",
        category: "socks",
        sizes: { create: [{ sizeLabel: "M" }] },
      },
    });
    await prisma.stockBalance.create({
      data: {
        schoolId: chain.school.id,
        itemId: extra.id,
        sizeLabel: "M",
        qtyOnHand: 10,
      },
    });

    await issueKit({
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      studentId: chain.student.id,
      paymentMethod: "cash",
      lines: [
        {
          itemId: chain.item.id,
          sizeLabel: "M",
          qtyRequested: 1,
          fulfil: true,
        },
        {
          itemId: extra.id,
          sizeLabel: "M",
          qtyRequested: 2,
          fulfil: false,
        },
      ],
    });

    const snap = await loadIssueDeskData(chain.school.id);
    const shirt = snap.items.find((i) => i.id === chain.item.id);
    expect(shirt?.unitPriceCents).toBe(10000);
    expect(
      snap.kits.some((k) =>
        k.lines.some(
          (l) => l.itemId === chain.item.id && l.item.unitPriceCents === 10000,
        ),
      ),
    ).toBe(true);

    const student = snap.students.find((s) => s.id === chain.student.id);
    expect(student?.uniformSet?.lines).toHaveLength(2);
    const given = student?.uniformSet?.lines.find(
      (l) => l.itemId === chain.item.id,
    );
    const leftover = student?.uniformSet?.lines.find((l) => l.itemId === extra.id);
    expect(given).toMatchObject({
      qtyNeeded: 1,
      qtyReceived: 1,
      qtyLeft: 0,
      unitPriceCents: 10000,
    });
    expect(leftover).toMatchObject({
      qtyNeeded: 2,
      qtyReceived: 0,
      qtyLeft: 2,
      unitPriceCents: 0,
    });
  });
});
