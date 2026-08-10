import { prisma } from "@/lib/db";
import { holdReasonLabel } from "@/modules/issue/outstanding";

function daysBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

/** Paid (or deposit) kit lines not yet fully received — aging queue. */
export async function listPaidNotCollected(
  schoolId: string,
  opts?: { take?: number },
) {
  const take = opts?.take ?? 100;
  const now = new Date();

  const plans = await prisma.studentUniformPlan.findMany({
    where: {
      schoolId,
      status: "open",
      lines: {
        some: {
          moneyStatus: { in: ["paid", "deposit"] },
        },
      },
    },
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
        include: { item: { select: { id: true, name: true, sku: true } } },
      },
    },
    orderBy: { openedAt: "asc" },
    take: take * 2,
  });

  return plans
    .map((plan) => {
      const lines = plan.lines
        .filter(
          (l) =>
            (l.moneyStatus === "paid" || l.moneyStatus === "deposit") &&
            l.qtyReceived < l.qtyNeeded,
        )
        .map((l) => ({
          itemId: l.itemId,
          itemName: l.item.name,
          sku: l.item.sku,
          qtyOwed: l.qtyNeeded - l.qtyReceived,
          moneyStatus: l.moneyStatus,
          holdReason: l.holdReason,
          holdLabel: holdReasonLabel(l.holdReason),
        }));
      const totalOwed = lines.reduce((s, l) => s + l.qtyOwed, 0);
      return {
        planId: plan.id,
        label: plan.label,
        student: plan.student,
        lines,
        totalOwed,
        openedAt: plan.openedAt,
        ageDays: daysBetween(plan.openedAt, now),
      };
    })
    .filter((row) => row.totalOwed > 0 && row.student.active);
}

/** Desk cash-up: payments recorded on issue slips for a day. */
export async function listDeskCashUp(
  schoolId: string,
  day: Date,
) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const slips = await prisma.issueSlip.findMany({
    where: {
      schoolId,
      status: "issued",
      issuedAt: { gte: start, lt: end },
      paymentMethod: { not: null },
    },
    include: {
      student: {
        select: {
          fullName: true,
          admissionNo: true,
          parentName: true,
          parentPhone: true,
        },
      },
    },
    orderBy: { issuedAt: "asc" },
  });

  const byMethod: Record<string, { count: number; amountCents: number }> = {};
  let totalAmountCents = 0;
  let withAmount = 0;

  for (const slip of slips) {
    const method = slip.paymentMethod ?? "other";
    if (!byMethod[method]) byMethod[method] = { count: 0, amountCents: 0 };
    byMethod[method].count += 1;
    if (slip.paymentAmountCents != null) {
      byMethod[method].amountCents += slip.paymentAmountCents;
      totalAmountCents += slip.paymentAmountCents;
      withAmount += 1;
    }
  }

  return {
    day: start,
    slips,
    byMethod,
    slipCount: slips.length,
    withAmountCount: withAmount,
    totalAmountCents,
  };
}
