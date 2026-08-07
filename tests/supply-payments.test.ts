import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { recordManualPayment } from "@/modules/payments/payments";
import { createDelivery, receiveAgainstDelivery } from "@/modules/supply/deliveries";
import { createInvoiceFromDelivery } from "@/modules/supply/invoices";
import { seedSupplyChain } from "./helpers/fixtures";

describe("supply receive + payment invariants", () => {
  it("receive against delivery posts stock and ledger", async () => {
    const chain = await seedSupplyChain();

    const delivery = await createDelivery({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      markInTransit: true,
      lines: [
        { productId: chain.product.id, sizeLabel: "M", qty: 4 },
      ],
    });

    await receiveAgainstDelivery({
      schoolId: chain.school.id,
      actorUserId: chain.user.id,
      deliveryId: delivery.id,
      note: "Gate receive",
    });

    const balance = await prisma.stockBalance.findUniqueOrThrow({
      where: {
        schoolId_itemId_sizeLabel: {
          schoolId: chain.school.id,
          itemId: chain.item.id,
          sizeLabel: "M",
        },
      },
    });
    // opening 5 + received 4
    expect(balance.qtyOnHand).toBe(9);

    const updated = await prisma.delivery.findUniqueOrThrow({
      where: { id: delivery.id },
    });
    expect(updated.status).toBe("delivered");

    const ledger = await prisma.stockLedgerEntry.findFirst({
      where: { refType: "deliveries", refId: delivery.id, reason: "receive" },
    });
    expect(ledger?.qtyDelta).toBe(4);

    const receipt = await prisma.inboundReceipt.findFirst({
      where: { deliveryId: delivery.id },
    });
    expect(receipt).toBeTruthy();
  });

  it("rejects double receive on the same delivery", async () => {
    const chain = await seedSupplyChain();
    const delivery = await createDelivery({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      lines: [
        { productId: chain.product.id, sizeLabel: "M", qty: 1 },
      ],
    });

    await receiveAgainstDelivery({
      schoolId: chain.school.id,
      actorUserId: chain.user.id,
      deliveryId: delivery.id,
    });

    await expect(
      receiveAgainstDelivery({
        schoolId: chain.school.id,
        actorUserId: chain.user.id,
        deliveryId: delivery.id,
      }),
    ).rejects.toThrow(/already received/i);
  });

  it("manual payment settles invoice when balance is covered", async () => {
    const chain = await seedSupplyChain();
    const delivery = await createDelivery({
      supplierId: chain.supplier.id,
      schoolId: chain.school.id,
      actorUserId: chain.supplierUser.id,
      lines: [
        { productId: chain.product.id, sizeLabel: "M", qty: 2 },
      ],
    });

    const invoice = await createInvoiceFromDelivery({
      supplierId: chain.supplier.id,
      actorUserId: chain.supplierUser.id,
      deliveryId: delivery.id,
    });
    expect(invoice.amountCents).toBe(20000);
    expect(invoice.status).toBe("issued");

    await recordManualPayment({
      supplierId: chain.supplier.id,
      actorUserId: chain.supplierUser.id,
      invoiceId: invoice.id,
      method: "cash",
      reference: "RCPT-1",
    });

    const paid = await prisma.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { payments: true },
    });
    expect(paid.status).toBe("paid");
    expect(paid.paidAt).toBeTruthy();
    expect(paid.payments).toHaveLength(1);
    expect(paid.payments[0]?.status).toBe("completed");
    expect(paid.payments[0]?.amountCents).toBe(20000);
  });
});
