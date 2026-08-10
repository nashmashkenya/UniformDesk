import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { issueKit } from "@/modules/issue/issue";
import {
  getStudentStillToReceive,
  holdReasonLabel,
} from "@/modules/issue/outstanding";
import {
  listDeskCashUp,
  listPaidNotCollected,
} from "@/modules/issue/plan-reports";
import { buildParentReceiptSummary } from "@/modules/issue/receipt";
import { seedSupplyChain } from "./helpers/fixtures";

describe("Phase 0 — parent contact on student", () => {
  it("stores parent name and phone on create", async () => {
    const chain = await seedSupplyChain();
    const student = await prisma.student.update({
      where: { id: chain.student.id },
      data: {
        parentName: "Jane Parent",
        parentPhone: "0712345678",
      },
    });
    expect(student.parentName).toBe("Jane Parent");
    expect(student.parentPhone).toBe("0712345678");
  });
});

describe("Phase A — issue now vs hold + kit status", () => {
  it("holds a line without reducing stock and marks still owed", async () => {
    const chain = await seedSupplyChain();
    const before = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: chain.school.id,
          itemId: chain.item.id,
          sizeLabel: "M",
        },
      },
    });

    const slip = await issueKit({
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      studentId: chain.student.id,
      paymentMethod: "mpesa",
      paymentReference: "ABC123",
      kitId: undefined,
      lines: [
        {
          itemId: chain.item.id,
          sizeLabel: "M",
          qtyRequested: 2,
          fulfil: false,
        },
      ],
    });

    expect(slip.lines[0]?.heldByDesk).toBe(true);
    expect(slip.lines[0]?.qtyIssued).toBe(0);
    expect(slip.lines[0]?.shortageQty).toBe(2);

    const after = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: chain.school.id,
          itemId: chain.item.id,
          sizeLabel: "M",
        },
      },
    });
    expect(after.qtyOnHand).toBe(before.qtyOnHand);

    const still = await getStudentStillToReceive(
      chain.school.id,
      chain.student.id,
    );
    expect(still?.totalOwed).toBe(2);
    expect(still?.lines[0]?.holdReason).toBe("held_by_desk");
    expect(still?.lines[0]?.moneyStatus).toBe("paid");
  });

  it("issues some lines and holds others in one desk visit", async () => {
    const chain = await seedSupplyChain();
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

    const slip = await issueKit({
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

    const issued = slip.lines.find((l) => l.itemId === chain.item.id);
    const held = slip.lines.find((l) => l.itemId === extra.id);
    expect(issued?.qtyIssued).toBe(1);
    expect(held?.heldByDesk).toBe(true);

    const still = await getStudentStillToReceive(
      chain.school.id,
      chain.student.id,
    );
    expect(still?.lines.some((l) => l.itemId === extra.id)).toBe(true);
  });

  it("marks stock short when issue now lacks on-hand qty", async () => {
    const chain = await seedSupplyChain();
    await prisma.stockBalance.update({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: chain.school.id,
          itemId: chain.item.id,
          sizeLabel: "M",
        },
      },
      data: { qtyOnHand: 0 },
    });

    const slip = await issueKit({
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
      ],
    });

    expect(slip.lines[0]?.heldByDesk).toBe(false);
    expect(slip.lines[0]?.shortageQty).toBe(1);

    const still = await getStudentStillToReceive(
      chain.school.id,
      chain.student.id,
    );
    expect(still?.lines[0]?.holdReason).toBe("stock_shortage");
    expect(holdReasonLabel(still?.lines[0]?.holdReason)).toBe("Stock short");
    expect(holdReasonLabel("held_by_desk")).toBe("Held at desk");
  });
});

describe("Phase B — paid not collected + aging", () => {
  it("lists paid still-owed lines with age days", async () => {
    const chain = await seedSupplyChain();
    await issueKit({
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      studentId: chain.student.id,
      paymentMethod: "bank",
      paymentReference: "REF-9",
      lines: [
        {
          itemId: chain.item.id,
          sizeLabel: "M",
          qtyRequested: 3,
          fulfil: false,
        },
      ],
    });

    const rows = await listPaidNotCollected(chain.school.id);
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const row = rows.find((r) => r.student.id === chain.student.id);
    expect(row?.totalOwed).toBe(3);
    expect(row?.ageDays).toBeGreaterThanOrEqual(0);
    expect(row?.lines[0]?.moneyStatus).toBe("paid");
  });
});

describe("Phase C — optional payment amount + cash-up", () => {
  it("stores amount cents and aggregates cash-up", async () => {
    const chain = await seedSupplyChain();
    await issueKit({
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      studentId: chain.student.id,
      paymentMethod: "cash",
      paymentAmountCents: 450_000,
      lines: [
        {
          itemId: chain.item.id,
          sizeLabel: "M",
          qtyRequested: 1,
          fulfil: true,
        },
      ],
    });

    const cash = await listDeskCashUp(chain.school.id, new Date());
    expect(cash.slipCount).toBeGreaterThanOrEqual(1);
    expect(cash.totalAmountCents).toBeGreaterThanOrEqual(450_000);
    expect(cash.byMethod.cash?.count).toBeGreaterThanOrEqual(1);
  });
});

describe("Phase D — parent receipt summary", () => {
  it("builds received vs pending text including parent", async () => {
    const chain = await seedSupplyChain();
    await prisma.student.update({
      where: { id: chain.student.id },
      data: { parentName: "Sam Parent", parentPhone: "0700111222" },
    });

    const slip = await issueKit({
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      studentId: chain.student.id,
      paymentMethod: "mpesa",
      paymentReference: "QX12",
      paymentAmountCents: 200_000,
      lines: [
        {
          itemId: chain.item.id,
          sizeLabel: "M",
          qtyRequested: 2,
          fulfil: true,
        },
      ],
    });

    // Force a pending balance by holding extra need via a second hold
    await issueKit({
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      studentId: chain.student.id,
      paymentMethod: "mpesa",
      paymentReference: "QX12",
      lines: [
        {
          itemId: chain.item.id,
          sizeLabel: "M",
          qtyRequested: 1,
          fulfil: false,
        },
      ],
    });

    const fresh = await prisma.issueSlip.findUniqueOrThrow({
      where: { id: slip.id },
      include: {
        lines: { include: { item: true } },
        student: true,
      },
    });
    const openPlan = await prisma.studentUniformPlan.findFirst({
      where: {
        schoolId: chain.school.id,
        studentId: chain.student.id,
        status: "open",
      },
      include: {
        lines: { include: { item: { select: { name: true } } } },
      },
    });

    const receipt = buildParentReceiptSummary({
      slip: fresh,
      openPlan,
    });
    expect(receipt.text).toMatch(/Sam Parent/);
    expect(receipt.text).toMatch(/Received today/);
    expect(receipt.text).toMatch(/Still pending/);
    expect(receipt.pendingCount).toBeGreaterThan(0);
  });
});
