import { prisma } from "@/lib/db";

export type StillToReceiveLine = {
  itemId: string;
  itemName: string;
  qtyOwed: number;
  sizeLabel: string | null;
  moneyStatus: "unpaid" | "paid" | "deposit" | "waived";
  holdReason: string | null;
};

export type StudentStillToReceive = {
  planId: string;
  label: string;
  lines: StillToReceiveLine[];
  totalOwed: number;
  openedAt: Date;
};

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

function owed(needed: number, received: number) {
  return Math.max(0, needed - received);
}

function mapOwedLine(l: {
  itemId: string;
  item: { id: string; name: string };
  qtyNeeded: number;
  qtyReceived: number;
  sizeLabel: string | null;
  moneyStatus: "unpaid" | "paid" | "deposit" | "waived";
  holdReason: string | null;
}): StillToReceiveLine {
  return {
    itemId: l.itemId,
    itemName: l.item.name,
    qtyOwed: owed(l.qtyNeeded, l.qtyReceived),
    sizeLabel: l.sizeLabel,
    moneyStatus: l.moneyStatus,
    holdReason: l.holdReason,
  };
}

export async function getStudentStillToReceive(
  schoolId: string,
  studentId: string,
): Promise<StudentStillToReceive | null> {
  const plan = await prisma.studentUniformPlan.findFirst({
    where: { schoolId, studentId, status: "open" },
    include: {
      lines: {
        include: { item: { select: { id: true, name: true } } },
        orderBy: { item: { name: "asc" } },
      },
    },
  });
  if (!plan) return null;

  const lines = plan.lines
    .map(mapOwedLine)
    .filter((l) => l.qtyOwed > 0);

  if (!lines.length) return null;

  return {
    planId: plan.id,
    label: plan.label,
    lines,
    totalOwed: lines.reduce((s, l) => s + l.qtyOwed, 0),
    openedAt: plan.openedAt,
  };
}

export async function listStudentsStillOwed(
  schoolId: string,
  take = 100,
) {
  const plans = await prisma.studentUniformPlan.findMany({
    where: { schoolId, status: "open" },
    include: {
      student: {
        select: {
          id: true,
          admissionNo: true,
          fullName: true,
          className: true,
          parentName: true,
          parentPhone: true,
          active: true,
        },
      },
      lines: {
        include: { item: { select: { id: true, name: true } } },
      },
    },
    orderBy: { openedAt: "asc" },
    take,
  });

  return plans
    .map((plan) => {
      const lines = plan.lines
        .map(mapOwedLine)
        .filter((l) => l.qtyOwed > 0);
      const totalOwed = lines.reduce((s, l) => s + l.qtyOwed, 0);
      return {
        planId: plan.id,
        label: plan.label,
        student: plan.student,
        lines,
        totalOwed,
        openedAt: plan.openedAt,
      };
    })
    .filter((row) => row.totalOwed > 0 && row.student.active);
}

/** After a successful issue — open/extend plan and mark items received. */
export async function applyIssueToUniformPlan(
  tx: Tx,
  input: {
    schoolId: string;
    studentId: string;
    kitId?: string | null;
    moneyStatus?: "unpaid" | "paid" | "deposit" | "waived";
    lines: {
      itemId: string;
      sizeLabel?: string | null;
      qtyRequested: number;
      qtyIssued: number;
      holdReason?: "stock_shortage" | "held_by_desk" | null;
    }[];
  },
) {
  const moneyStatus = input.moneyStatus ?? "unpaid";
  const now = new Date();
  let plan = await tx.studentUniformPlan.findFirst({
    where: {
      schoolId: input.schoolId,
      studentId: input.studentId,
      status: "open",
    },
    include: { lines: true },
  });

  if (!plan && input.kitId) {
    const kit = await tx.kit.findFirst({
      where: {
        id: input.kitId,
        schoolId: input.schoolId,
        active: true,
      },
      include: { lines: true },
    });
    if (kit?.lines.length) {
      plan = await tx.studentUniformPlan.create({
        data: {
          schoolId: input.schoolId,
          studentId: input.studentId,
          kitId: kit.id,
          label: kit.name,
          academicYear: kit.academicYear,
          status: "open",
          lines: {
            create: kit.lines.map((l) => ({
              itemId: l.itemId,
              qtyNeeded: l.qtyDefault,
              qtyReceived: 0,
            })),
          },
        },
        include: { lines: true },
      });
    }
  }

  if (!plan) {
    const byItem = new Map<string, number>();
    for (const line of input.lines) {
      byItem.set(
        line.itemId,
        (byItem.get(line.itemId) ?? 0) + line.qtyRequested,
      );
    }
    plan = await tx.studentUniformPlan.create({
      data: {
        schoolId: input.schoolId,
        studentId: input.studentId,
        kitId: input.kitId || null,
        label: "Admission uniform",
        status: "open",
        lines: {
          create: [...byItem.entries()].map(([itemId, qtyNeeded]) => ({
            itemId,
            qtyNeeded,
            qtyReceived: 0,
          })),
        },
      },
      include: { lines: true },
    });
  } else if (input.kitId && !plan.kitId) {
    await tx.studentUniformPlan.update({
      where: { id: plan.id },
      data: { kitId: input.kitId },
    });
  }

  for (const line of input.lines) {
    const existing = plan.lines.find((l) => l.itemId === line.itemId);
    const nextNeededBase = Math.max(
      existing?.qtyNeeded ?? 0,
      line.qtyRequested,
    );
    const nextReceived = (existing?.qtyReceived ?? 0) + line.qtyIssued;
    const nextNeeded = Math.max(nextNeededBase, nextReceived);
    const stillOwed = nextNeeded - nextReceived;
    const holdReason =
      stillOwed > 0 ? (line.holdReason ?? existing?.holdReason ?? null) : null;
    const sizeLabel =
      line.sizeLabel?.trim() || existing?.sizeLabel || null;

    if (existing) {
      await tx.studentUniformPlanLine.update({
        where: { id: existing.id },
        data: {
          qtyNeeded: nextNeeded,
          qtyReceived: nextReceived,
          sizeLabel,
          moneyStatus,
          holdReason,
          heldAt: holdReason ? existing.heldAt ?? now : null,
        },
      });
      existing.qtyNeeded = nextNeeded;
      existing.qtyReceived = nextReceived;
      existing.sizeLabel = sizeLabel;
      existing.moneyStatus = moneyStatus;
      existing.holdReason = holdReason;
    } else {
      const created = await tx.studentUniformPlanLine.create({
        data: {
          planId: plan.id,
          itemId: line.itemId,
          qtyNeeded: nextNeeded,
          qtyReceived: line.qtyIssued,
          sizeLabel,
          moneyStatus,
          holdReason,
          heldAt: holdReason ? now : null,
        },
      });
      plan.lines.push(created);
    }
  }

  // If kit was chosen and plan already existed, ensure kit lines are on the plan
  if (input.kitId) {
    const kit = await tx.kit.findFirst({
      where: { id: input.kitId, schoolId: input.schoolId },
      include: { lines: true },
    });
    if (kit) {
      for (const kl of kit.lines) {
        const existing = plan.lines.find((l) => l.itemId === kl.itemId);
        if (!existing) {
          const created = await tx.studentUniformPlanLine.create({
            data: {
              planId: plan.id,
              itemId: kl.itemId,
              qtyNeeded: kl.qtyDefault,
              qtyReceived: 0,
            },
          });
          plan.lines.push(created);
        } else if (existing.qtyNeeded < kl.qtyDefault) {
          await tx.studentUniformPlanLine.update({
            where: { id: existing.id },
            data: { qtyNeeded: kl.qtyDefault },
          });
          existing.qtyNeeded = kl.qtyDefault;
        }
      }
      if (plan.label === "Admission uniform") {
        await tx.studentUniformPlan.update({
          where: { id: plan.id },
          data: { label: kit.name, academicYear: kit.academicYear },
        });
      }
    }
  }

  const fresh = await tx.studentUniformPlanLine.findMany({
    where: { planId: plan.id },
  });
  const allDone = fresh.every((l) => l.qtyReceived >= l.qtyNeeded);
  if (allDone) {
    await tx.studentUniformPlan.update({
      where: { id: plan.id },
      data: { status: "complete", completedAt: new Date() },
    });
  }
}

/** When a slip is voided — put those quantities back on “still to receive”. */
export async function reverseIssueOnUniformPlan(
  tx: Tx,
  input: {
    schoolId: string;
    studentId: string;
    lines: { itemId: string; qtyIssued: number }[];
  },
) {
  let plan = await tx.studentUniformPlan.findFirst({
    where: {
      schoolId: input.schoolId,
      studentId: input.studentId,
      status: { in: ["open", "complete"] },
    },
    include: { lines: true },
    orderBy: { openedAt: "desc" },
  });
  if (!plan) return;

  for (const line of input.lines) {
    if (line.qtyIssued <= 0) continue;
    const existing = plan.lines.find((l) => l.itemId === line.itemId);
    if (!existing) continue;
    const next = Math.max(0, existing.qtyReceived - line.qtyIssued);
    await tx.studentUniformPlanLine.update({
      where: { id: existing.id },
      data: { qtyReceived: next },
    });
    existing.qtyReceived = next;
  }

  if (plan.status === "complete") {
    await tx.studentUniformPlan.update({
      where: { id: plan.id },
      data: { status: "open", completedAt: null },
    });
  }
}

export async function loadStillToReceiveByStudent(
  schoolId: string,
  studentIds: string[],
) {
  if (!studentIds.length) return new Map<string, StudentStillToReceive>();

  const plans = await prisma.studentUniformPlan.findMany({
    where: {
      schoolId,
      studentId: { in: studentIds },
      status: "open",
    },
    include: {
      lines: {
        include: { item: { select: { id: true, name: true } } },
      },
    },
  });

  const map = new Map<string, StudentStillToReceive>();
  for (const plan of plans) {
    const lines = plan.lines
      .map(mapOwedLine)
      .filter((l) => l.qtyOwed > 0);
    if (!lines.length) continue;
    map.set(plan.studentId, {
      planId: plan.id,
      label: plan.label,
      lines,
      totalOwed: lines.reduce((s, l) => s + l.qtyOwed, 0),
      openedAt: plan.openedAt,
    });
  }
  return map;
}

export async function loadUniformSetsByStudent(
  schoolId: string,
  studentIds: string[],
) {
  if (!studentIds.length) {
    return new Map<
      string,
      {
        planId: string;
        kitId: string | null;
        label: string;
        lines: {
          itemId: string;
          itemName: string;
          sku: string;
          qtyNeeded: number;
          qtyReceived: number;
          qtyLeft: number;
          sizeLabel: string | null;
          moneyStatus: "unpaid" | "paid" | "deposit" | "waived";
          holdReason: string | null;
        }[];
      }
    >();
  }

  const plans = await prisma.studentUniformPlan.findMany({
    where: {
      schoolId,
      studentId: { in: studentIds },
      status: "open",
    },
    include: {
      lines: {
        include: { item: { select: { id: true, name: true, sku: true } } },
        orderBy: { item: { name: "asc" } },
      },
    },
  });

  const map = new Map<
    string,
    {
      planId: string;
      kitId: string | null;
      label: string;
      lines: {
        itemId: string;
        itemName: string;
        sku: string;
        qtyNeeded: number;
        qtyReceived: number;
        qtyLeft: number;
        sizeLabel: string | null;
        moneyStatus: "unpaid" | "paid" | "deposit" | "waived";
        holdReason: string | null;
      }[];
    }
  >();

  for (const plan of plans) {
    map.set(plan.studentId, {
      planId: plan.id,
      kitId: plan.kitId,
      label: plan.label,
      lines: plan.lines.map((l) => ({
        itemId: l.itemId,
        itemName: l.item.name,
        sku: l.item.sku,
        qtyNeeded: l.qtyNeeded,
        qtyReceived: l.qtyReceived,
        qtyLeft: owed(l.qtyNeeded, l.qtyReceived),
        sizeLabel: l.sizeLabel,
        moneyStatus: l.moneyStatus,
        holdReason: l.holdReason,
      })),
    });
  }
  return map;
}

export {
  holdReasonLabel,
  moneyStatusLabel,
} from "@/modules/issue/plan-labels";

