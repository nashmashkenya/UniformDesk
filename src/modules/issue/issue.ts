import { prisma } from "@/lib/db";
import { newPublicToken } from "@/modules/issue/proof";

export type IssueLineInput = {
  itemId: string;
  sizeLabel: string;
  qtyRequested: number;
};

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
  acknowledgmentName: string;
  acknowledgmentSignature: string;
  lines: IssueLineInput[];
}) {
  if (!input.acknowledgmentName.trim()) {
    throw new Error("Acknowledgment name is required");
  }
  if (!input.acknowledgmentSignature.startsWith("data:image")) {
    throw new Error("Signature is required");
  }
  if (!input.lines.length) {
    throw new Error("Add at least one item to issue");
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
        acknowledgmentName: input.acknowledgmentName.trim(),
        acknowledgmentSignature: input.acknowledgmentSignature,
        acknowledgedAt: now,
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

    return slip;
  });
}

export async function getSlip(schoolId: string, slipId: string) {
  return prisma.issueSlip.findFirst({
    where: { id: slipId, schoolId },
    include: {
      lines: { include: { item: true } },
      student: true,
      issuedBy: true,
      voidedBy: true,
      school: true,
    },
  });
}
