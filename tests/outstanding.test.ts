import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { issueKit } from "@/modules/issue/issue";
import {
  getStudentStillToReceive,
  listStudentsStillOwed,
} from "@/modules/issue/outstanding";
import { voidIssue } from "@/modules/issue/void";
import { seedSchoolDesk } from "./helpers/fixtures";

describe("still to receive (incomplete uniforms)", () => {
  it("tracks leftover items when stock is short on a kit issue", async () => {
    const desk = await seedSchoolDesk({ openingQty: 1 });
    const sweater = await prisma.item.create({
      data: {
        schoolId: desk.school.id,
        sku: "SWT-NVY",
        name: "Navy Sweater",
        category: "sweater",
        sizes: { create: [{ sizeLabel: "M" }] },
      },
    });
    await prisma.stockBalance.create({
      data: {
        schoolId: desk.school.id,
        itemId: sweater.id,
        sizeLabel: "M",
        qtyOnHand: 0,
      },
    });

    const kit = await prisma.kit.create({
      data: {
        schoolId: desk.school.id,
        name: "Form 1 set",
        academicYear: "2026",
        lines: {
          create: [
            { itemId: desk.item.id, qtyDefault: 1 },
            { itemId: sweater.id, qtyDefault: 1 },
          ],
        },
      },
    });

    await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      kitId: kit.id,
      paymentMethod: "cash",
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 1 },
        { itemId: sweater.id, sizeLabel: "M", qtyRequested: 1 },
      ],
    });

    const still = await getStudentStillToReceive(
      desk.school.id,
      desk.student.id,
    );
    expect(still).not.toBeNull();
    expect(still?.label).toBe("Form 1 set");
    expect(still?.lines).toEqual([
      expect.objectContaining({
        itemId: sweater.id,
        itemName: "Navy Sweater",
        qtyOwed: 1,
      }),
    ]);

    const list = await listStudentsStillOwed(desk.school.id);
    expect(list.some((r) => r.student.id === desk.student.id)).toBe(true);
  });

  it("clears still-to-receive when the remaining item is issued", async () => {
    const desk = await seedSchoolDesk({ openingQty: 0 });
    await prisma.stockBalance.update({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: desk.school.id,
          itemId: desk.item.id,
          sizeLabel: "M",
        },
      },
      data: { qtyOnHand: 0 },
    });

    // Zero stock: desk still records the need as still owed (stock short)
    const emptySlip = await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      paymentMethod: "cash",
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 2 },
      ],
    });
    expect(emptySlip.lines[0]?.qtyIssued).toBe(0);
    expect(emptySlip.lines[0]?.shortageQty).toBe(2);

    let still = await getStudentStillToReceive(desk.school.id, desk.student.id);
    expect(still?.totalOwed).toBe(2);
    expect(still?.lines[0]?.holdReason).toBe("stock_shortage");

    await prisma.stockBalance.update({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: desk.school.id,
          itemId: desk.item.id,
          sizeLabel: "M",
        },
      },
      data: { qtyOnHand: 1 },
    });

    await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      paymentMethod: "cash",
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 2 },
      ],
    });

    still = await getStudentStillToReceive(desk.school.id, desk.student.id);
    expect(still?.totalOwed).toBe(1);

    await prisma.stockBalance.update({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: desk.school.id,
          itemId: desk.item.id,
          sizeLabel: "M",
        },
      },
      data: { qtyOnHand: 5 },
    });

    await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      paymentMethod: "cash",
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 1 },
      ],
    });

    still = await getStudentStillToReceive(desk.school.id, desk.student.id);
    expect(still).toBeNull();

    const plan = await prisma.studentUniformPlan.findFirst({
      where: { studentId: desk.student.id },
      orderBy: { openedAt: "desc" },
    });
    expect(plan?.status).toBe("complete");
  });

  it("puts items back on still-to-receive when a slip is voided", async () => {
    const desk = await seedSchoolDesk({ openingQty: 5 });
    const slip = await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      paymentMethod: "cash",
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 1 },
      ],
    });

    expect(
      await getStudentStillToReceive(desk.school.id, desk.student.id),
    ).toBeNull();

    await voidIssue({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      slipId: slip.id,
      reason: "Wrong size",
    });

    const still = await getStudentStillToReceive(
      desk.school.id,
      desk.student.id,
    );
    expect(still?.totalOwed).toBe(1);
  });
});
