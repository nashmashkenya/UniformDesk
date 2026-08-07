import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { issueKit } from "@/modules/issue/issue";
import { voidIssue } from "@/modules/issue/void";
import { fakeSignature, seedSchoolDesk } from "./helpers/fixtures";

describe("issue + void ledger invariants", () => {
  it("rejects issue without a signature image", async () => {
    const desk = await seedSchoolDesk();

    await expect(
      issueKit({
        schoolId: desk.school.id,
        actorUserId: desk.user.id,
        studentId: desk.student.id,
        acknowledgmentName: "Parent",
        acknowledgmentSignature: "not-an-image",
        lines: [
          { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 1 },
        ],
      }),
    ).rejects.toThrow(/signature/i);
  });

  it("decrements stock and appends an issue ledger entry", async () => {
    const desk = await seedSchoolDesk({ openingQty: 10 });

    const slip = await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      acknowledgmentName: "Parent",
      acknowledgmentSignature: fakeSignature(),
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 3 },
      ],
    });

    expect(slip.status).toBe("issued");
    expect(slip.publicToken).toBeTruthy();
    expect(slip.lines[0]?.qtyIssued).toBe(3);
    expect(slip.lines[0]?.shortageQty).toBe(0);

    const balance = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: desk.school.id,
          itemId: desk.item.id,
          sizeLabel: "M",
        },
      },
    });
    expect(balance.qtyOnHand).toBe(7);

    const ledger = await prisma.stockLedgerEntry.findMany({
      where: { refType: "issue_slips", refId: slip.id },
    });
    expect(ledger).toHaveLength(1);
    expect(ledger[0]?.qtyDelta).toBe(-3);
    expect(ledger[0]?.reason).toBe("issue");
  });

  it("records shortage when stock is insufficient (partial issue)", async () => {
    const desk = await seedSchoolDesk({ openingQty: 2 });

    const slip = await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      acknowledgmentName: "Parent",
      acknowledgmentSignature: fakeSignature(),
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 5 },
      ],
    });

    expect(slip.lines[0]?.qtyIssued).toBe(2);
    expect(slip.lines[0]?.shortageQty).toBe(3);

    const balance = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: desk.school.id,
          itemId: desk.item.id,
          sizeLabel: "M",
        },
      },
    });
    expect(balance.qtyOnHand).toBe(0);

    const shortage = await prisma.stockLedgerEntry.findFirst({
      where: { refId: slip.id, reason: "shortage" },
    });
    expect(shortage?.qtyDelta).toBe(0);
    expect(shortage?.note).toMatch(/3/);
  });

  it("void restores stock and requires a reason", async () => {
    const desk = await seedSchoolDesk({ openingQty: 8 });

    const slip = await issueKit({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      studentId: desk.student.id,
      acknowledgmentName: "Parent",
      acknowledgmentSignature: fakeSignature(),
      lines: [
        { itemId: desk.item.id, sizeLabel: "M", qtyRequested: 4 },
      ],
    });

    await expect(
      voidIssue({
        schoolId: desk.school.id,
        actorUserId: desk.user.id,
        slipId: slip.id,
        reason: "   ",
      }),
    ).rejects.toThrow(/reason/i);

    const voided = await voidIssue({
      schoolId: desk.school.id,
      actorUserId: desk.user.id,
      slipId: slip.id,
      reason: "Issued to wrong student",
    });
    expect(voided.status).toBe("voided");

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

    const voidLedger = await prisma.stockLedgerEntry.findFirst({
      where: { refId: slip.id, reason: "void" },
    });
    expect(voidLedger?.qtyDelta).toBe(4);
  });

  it("does not allow voiding another school's slip", async () => {
    const a = await seedSchoolDesk({ openingQty: 5 });
    const b = await seedSchoolDesk({ openingQty: 5 });

    const slip = await issueKit({
      schoolId: a.school.id,
      actorUserId: a.user.id,
      studentId: a.student.id,
      acknowledgmentName: "Parent",
      acknowledgmentSignature: fakeSignature(),
      lines: [{ itemId: a.item.id, sizeLabel: "M", qtyRequested: 1 }],
    });

    await expect(
      voidIssue({
        schoolId: b.school.id,
        actorUserId: b.user.id,
        slipId: slip.id,
        reason: "Cross-tenant attempt",
      }),
    ).rejects.toThrow(/not found/i);
  });
});
