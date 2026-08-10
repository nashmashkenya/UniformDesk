import { formatMoney } from "@/lib/money";

type SlipLike = {
  slipNo: string;
  issuedAt: Date;
  paymentMethod: string | null;
  paymentReference: string | null;
  paymentAmountCents: number | null;
  student: {
    fullName: string;
    admissionNo: string;
    parentName: string | null;
    parentPhone: string | null;
  };
  lines: {
    qtyIssued: number;
    qtyRequested: number;
    shortageQty: number;
    heldByDesk: boolean;
    item: { name: string };
    sizeLabel: string;
  }[];
};

type OpenPlanLike = {
  label: string;
  lines: {
    qtyNeeded: number;
    qtyReceived: number;
    sizeLabel?: string | null;
    item: { name: string };
  }[];
} | null;

/** Plain-language parent receipt: what was received vs still pending. */
export function buildParentReceiptSummary(input: {
  slip: SlipLike;
  openPlan: OpenPlanLike;
}) {
  const received = input.slip.lines
    .filter((l) => l.qtyIssued > 0)
    .map(
      (l) =>
        `${l.qtyIssued}× ${l.item.name} (${l.sizeLabel})`,
    );

  const pendingFromSlip = input.slip.lines
    .filter((l) => l.shortageQty > 0)
    .map((l) => {
      const why = l.heldByDesk ? "held" : "stock short";
      return `${l.shortageQty}× ${l.item.name} (${l.sizeLabel}) — ${why}`;
    });

  const pendingFromPlan =
    input.openPlan?.lines
      .filter((l) => l.qtyReceived < l.qtyNeeded)
      .map((l) => {
        const size = l.sizeLabel ? ` (${l.sizeLabel})` : "";
        return `${l.qtyNeeded - l.qtyReceived}× ${l.item.name}${size}`;
      }) ?? [];

  const pending =
    pendingFromPlan.length > 0 ? pendingFromPlan : pendingFromSlip;

  const payBits = [
    input.slip.paymentMethod,
    input.slip.paymentReference,
    input.slip.paymentAmountCents != null
      ? formatMoney(input.slip.paymentAmountCents)
      : null,
  ].filter(Boolean);

  const parent =
    [input.slip.student.parentName, input.slip.student.parentPhone]
      .filter(Boolean)
      .join(" · ") || null;

  const lines = [
    `UniformDesk slip ${input.slip.slipNo}`,
    `Student: ${input.slip.student.fullName} (${input.slip.student.admissionNo})`,
    parent ? `Parent: ${parent}` : null,
    payBits.length ? `Payment: ${payBits.join(" · ")}` : null,
    received.length
      ? `Received today: ${received.join("; ")}`
      : "Received today: none",
    pending.length
      ? `Still pending: ${pending.join("; ")}`
      : "Still pending: none — kit complete",
  ].filter(Boolean) as string[];

  return {
    lines,
    text: lines.join("\n"),
    receivedCount: received.length,
    pendingCount: pending.length,
  };
}
