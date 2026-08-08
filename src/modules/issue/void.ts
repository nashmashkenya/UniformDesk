import { prisma } from "@/lib/db";
import { reverseIssueOnUniformPlan } from "@/modules/issue/outstanding";

export async function voidIssue(input: {
  schoolId: string;
  actorUserId: string;
  slipId: string;
  reason: string;
}) {
  if (!input.reason.trim()) {
    throw new Error("Void reason is required");
  }

  return prisma.$transaction(async (tx) => {
    const slip = await tx.issueSlip.findFirst({
      where: { id: input.slipId, schoolId: input.schoolId },
      include: { lines: true },
    });
    if (!slip) throw new Error("Issue slip not found");
    if (slip.status === "voided") throw new Error("Slip is already voided");

    const updated = await tx.issueSlip.update({
      where: { id: slip.id },
      data: {
        status: "voided",
        voidedAt: new Date(),
        voidedById: input.actorUserId,
        voidReason: input.reason.trim(),
      },
      include: {
        lines: { include: { item: true } },
        student: true,
        issuedBy: true,
        voidedBy: true,
        school: true,
      },
    });

    for (const line of slip.lines) {
      if (line.qtyIssued <= 0) continue;

      await tx.stockLedgerEntry.create({
        data: {
          schoolId: input.schoolId,
          itemId: line.itemId,
          sizeLabel: line.sizeLabel,
          qtyDelta: line.qtyIssued,
          reason: "void",
          refType: "issue_slips",
          refId: slip.id,
          actorUserId: input.actorUserId,
          note: input.reason.trim(),
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
          qtyOnHand: line.qtyIssued,
        },
        update: {
          qtyOnHand: { increment: line.qtyIssued },
        },
      });
    }

    await reverseIssueOnUniformPlan(tx, {
      schoolId: input.schoolId,
      studentId: slip.studentId,
      lines: slip.lines.map((line) => ({
        itemId: line.itemId,
        qtyIssued: line.qtyIssued,
      })),
    });

    return updated;
  });
}
