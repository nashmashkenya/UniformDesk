import type { PaymentMethod } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { applyIssueToUniformPlan } from "@/modules/issue/outstanding";
import { newPublicToken } from "@/modules/issue/proof";

export type IssueLineInput = {
  itemId: string;
  sizeLabel: string;
  qtyRequested: number;
};

const DESK_ACK_NAME = "Desk issue";
/** Minimal placeholder — parent slip/signature not required */
const DESK_ACK_MARK =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

type DbClient = {
  issueSlip: typeof prisma.issueSlip;
};

async function nextSlipNo(schoolId: string, tx: DbClient) {
  const year = new Date().getFullYear();
  const prefix = `UD-${year}-`;
  const latest = await tx.issueSlip.findFirst({
    where: { schoolId, slipNo: { startsWith: prefix } },
    orderBy: { slipNo: "desc" },
    select: { slipNo: true },
  });
  const next = latest
    ? Number(latest.slipNo.slice(prefix.length)) + 1
    : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export async function issueKit(input: {
  schoolId: string;
  actorUserId: string;
  studentId: string;
  lines: IssueLineInput[];
  /** How parent paid at the desk (no amount stored) */
  paymentMethod: PaymentMethod;
  paymentReference?: string | null;
  /** When set, opens/extends the student’s “still to receive” kit plan */
  kitId?: string | null;
  /** @deprecated Parent slip/signature not required */
  acknowledgmentName?: string;
  acknowledgmentSignature?: string;
}) {
  if (!input.lines.length) {
    throw new Error("Add at least one item to issue");
  }
  if (!input.paymentMethod) {
    throw new Error("Payment method is required");
  }

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: {
        id: input.studentId,
        schoolId: input.schoolId,
        active: true,
      },
    });
    if (!student) throw new Error("Student not found");

    const prepared = [];
    for (const line of input.lines) {
      if (line.qtyRequested <= 0) {
        throw new Error("Requested quantity must be greater than zero");
      }
      const balance = await tx.stockBalance.findUnique({
        where: {
          schoolId_itemId_sizeLabel: {
            schoolId: input.schoolId,
            itemId: line.itemId,
            sizeLabel: line.sizeLabel,
          },
        },
      });
      const onHand = balance?.qtyOnHand ?? 0;
      const qtyIssued = Math.min(onHand, line.qtyRequested);
      const shortageQty = line.qtyRequested - qtyIssued;
      prepared.push({ ...line, qtyIssued, shortageQty, onHand });
    }

    if (prepared.every((line) => line.qtyIssued === 0)) {
      throw new Error("No stock available for the selected items");
    }

    const slipNo = await nextSlipNo(input.schoolId, tx);
    const now = new Date();

    const slip = await tx.issueSlip.create({
      data: {
        schoolId: input.schoolId,
        slipNo,
        studentId: input.studentId,
        issuedById: input.actorUserId,
        issuedAt: now,
        status: "issued",
        acknowledgmentName:
          input.acknowledgmentName?.trim() || DESK_ACK_NAME,
        acknowledgmentSignature:
          input.acknowledgmentSignature?.startsWith("data:image")
            ? input.acknowledgmentSignature
            : DESK_ACK_MARK,
        acknowledgedAt: now,
        paymentMethod: input.paymentMethod,
        paymentReference: input.paymentReference?.trim() || null,
        publicToken: newPublicToken(),
        lines: {
          create: prepared.map((line) => ({
            itemId: line.itemId,
            sizeLabel: line.sizeLabel,
            qtyRequested: line.qtyRequested,
            qtyIssued: line.qtyIssued,
            shortageQty: line.shortageQty,
          })),
        },
      },
      include: {
        lines: { include: { item: true } },
        student: true,
        issuedBy: true,
        school: true,
      },
    });

    for (const line of prepared) {
      if (line.qtyIssued > 0) {
        await tx.stockLedgerEntry.create({
          data: {
            schoolId: input.schoolId,
            itemId: line.itemId,
            sizeLabel: line.sizeLabel,
            qtyDelta: -line.qtyIssued,
            reason: "issue",
            refType: "issue_slips",
            refId: slip.id,
            actorUserId: input.actorUserId,
          },
        });

        await tx.stockBalance.update({
          where: {
            schoolId_itemId_sizeLabel: {
              schoolId: input.schoolId,
              itemId: line.itemId,
              sizeLabel: line.sizeLabel,
            },
          },
          data: { qtyOnHand: { decrement: line.qtyIssued } },
        });
      }

      if (line.shortageQty > 0) {
        await tx.stockLedgerEntry.create({
          data: {
            schoolId: input.schoolId,
            itemId: line.itemId,
            sizeLabel: line.sizeLabel,
            qtyDelta: 0,
            reason: "shortage",
            refType: "issue_slips",
            refId: slip.id,
            actorUserId: input.actorUserId,
            note: `Shortage of ${line.shortageQty}`,
          },
        });
      }
    }

    await applyIssueToUniformPlan(tx, {
      schoolId: input.schoolId,
      studentId: input.studentId,
      kitId: input.kitId,
      lines: prepared.map((line) => ({
        itemId: line.itemId,
        qtyRequested: line.qtyRequested,
        qtyIssued: line.qtyIssued,
      })),
    });

    return slip;
  });
}

export async function getSlip(schoolId: string, slipId: string) {
  return prisma.issueSlip.findFirst({
    where: { id: slipId, schoolId },
    include: {
      lines: { include: { item: true } },
      student: true,
      issuedBy: { include: { supplier: true, school: true } },
      voidedBy: true,
      school: true,
    },
  });
}
